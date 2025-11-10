const db = require('../config/db.config');

const normPhone = (raw) => (raw ? String(raw).replace(/[^\d]/g, '') : '');
const round2 = (x) => Math.round(Number(x) * 100) / 100;
const normId = (v) => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

exports.lookupCustomersByPhone = (phone, cb) => {
    const p = normPhone(phone);
    if (!p) return cb(null, []);

    const sql = `
    SELECT CustomerID, FirstName, LastName, Phone, Email, Points
    FROM Customers
    WHERE REPLACE(REPLACE(REPLACE(Phone,'-',''),'(',''),')','') = ?
    ORDER BY CustomerID DESC
    LIMIT 10
  `;
    db.query(sql, [p], (err, rows) => cb(err, rows));
};

exports.quoteOrder = ({ items, taxRate = 0 }, cb) => {
    if (!Array.isArray(items) || items.length === 0) {
        return cb(new Error('EMPTY_CART'));
    }

    const ids = items.map(it => it.ProductID);
    const placeholders = ids.map(() => '?').join(',');
    const sql = `SELECT ProductID, Price, Name FROM Products WHERE ProductID IN (${placeholders})`;

    db.query(sql, ids, (e, rows) => {
        if (e) return cb(e);

        const priceMap = new Map(rows.map(r => [r.ProductID, Number(r.Price)]));
        let subtotal = 0;
        let lines = [];

        try {
            lines = items.map(it => {
                const qty = Number(it.Qty) || 0;
                if (qty <= 0) throw new Error(`BAD_QTY:${it.ProductID}`);

                const price = priceMap.get(it.ProductID);
                if (price == null) throw new Error(`PRODUCT_NOT_FOUND:${it.ProductID}`);

                const name = rows.find(r => r.ProductID === it.ProductID)?.Name || '';
                const lineTotal = round2(price * qty);
                subtotal += lineTotal;

                return { ProductID: it.ProductID, Name: name, Qty: qty, Price: price, LineTotal: lineTotal };
            });
        } catch (err) {
            return cb(err);
        }

        subtotal = round2(subtotal);
        const tax = round2(subtotal * Number(taxRate));
        const total = round2(subtotal + tax);

        cb(null, { subtotal, tax, total, items: lines });
    });
};

exports.addToRegister = ({ customerId, guestId, employeeId, items, taxRate = 0 }, cb) => {
  if (!Array.isArray(items) || items.length === 0) return cb(new Error('EMPTY_CART'));

  const cust = normId(customerId);
  const guest = cust == null ? normId(guestId) : null;

  db.getConnection((err, conn) => {
    if (err) return cb(err);
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return cb(errTx); }

      try {
        const cleanItems = items.map(it => ({
          ProductID: Number(it.ProductID),
          Qty: Math.max(0, Number(it.Qty) || 0),
        })).filter(it => Number.isFinite(it.ProductID) && Number.isFinite(it.Qty));

        if (!cleanItems.length) {
          return conn.rollback(() => { conn.release(); cb(new Error('BAD_ITEMS')); });
        }
        if (cust == null && guest == null) {
          return conn.rollback(() => { conn.release(); cb(new Error('BAD_CUSTOMER_OR_GUEST')); });
        }

        const reqIds = Array.from(new Set(cleanItems.map(i => i.ProductID)));
        const placeholders = reqIds.map(() => '?').join(',');

        conn.query(
          `SELECT p.ProductID, p.Price AS OriginalPrice, p.Name, p.Stock,
                  d.DiscountType, d.DiscountValue
           FROM Products p
           LEFT JOIN Discounts d ON p.ProductID = d.ProductID
           WHERE p.ProductID IN (${placeholders})
           FOR UPDATE`,
          reqIds,
          (e1, rows) => {
            if (e1) return conn.rollback(() => { conn.release(); cb(e1); });

            const productMap = new Map(rows.map(r => [Number(r.ProductID), {
              Price: Number(r.OriginalPrice),
              Name: r.Name,
              Stock: Number(r.Stock),
              DiscountType: r.DiscountType || null,
              DiscountValue: Number(r.DiscountValue || 0),
            }]));

            const findSql = `
              SELECT RegisterListID
              FROM RegisterList
              WHERE ${cust != null ? 'CustomerID = ?' : 'CustomerID IS NULL AND GuestID = ?'}
              ORDER BY DateCreated DESC
              LIMIT 1
              FOR UPDATE
            `;

            conn.query(findSql, [cust != null ? cust : guest], (eFind, found) => {
              if (eFind) return conn.rollback(() => { conn.release(); cb(eFind); });
              const existingId = found?.[0]?.RegisterListID || null;

              const continueWithList = (registerListId) => {
                conn.query(
                  `SELECT ProductID, Quantity
                   FROM RegisterItems
                   WHERE RegisterListID = ?
                   FOR UPDATE`,
                  [registerListId],
                  (eLockItems, existingRows) => {
                    if (eLockItems) return conn.rollback(() => { conn.release(); cb(eLockItems); });

                    const prevMap = new Map((existingRows || []).map(r => [Number(r.ProductID), Number(r.Quantity)]));
                    const nextMap = new Map(cleanItems.map(it => [it.ProductID, it.Qty]));

                    const allIds = Array.from(new Set([...prevMap.keys(), ...nextMap.keys()]));
                    let idx = 0;

                    const applyStockDelta = (pid, delta, done) => {
                      if (delta === 0) return done();
                      if (delta > 0) {
                        conn.query(
                          `UPDATE Products SET Stock = Stock - ? WHERE ProductID = ? AND Stock >= ?`,
                          [delta, pid, delta],
                          (eU, rU) => {
                            if (eU) return done(eU);
                            if (rU.affectedRows === 0) return done(new Error(`INSUFFICIENT_STOCK:${pid}`));
                            done();
                          }
                        );
                      } else {
                        conn.query(
                          `UPDATE Products SET Stock = Stock + ? WHERE ProductID = ?`,
                          [Math.abs(delta), pid],
                          (eU) => done(eU || null)
                        );
                      }
                    };

                    const stepStock = () => {
                      if (idx >= allIds.length) return priceAndUpsert();
                      const pid = allIds[idx++];
                      const prevQ = prevMap.get(pid) || 0;
                      const nextQ = nextMap.get(pid) || 0;
                      const delta = nextQ - prevQ;
                      applyStockDelta(pid, delta, (eDelta) => {
                        if (eDelta) return conn.rollback(() => { conn.release(); cb(eDelta); });
                        stepStock();
                      });
                    };

                    const priceAndUpsert = () => {
                      let subtotal = 0;
                      const lines = [];

                      try {
                        for (const [pid, qty] of nextMap.entries()) {
                          if (qty <= 0) continue;
                          const prod = productMap.get(pid);
                          if (!prod) throw new Error(`PRODUCT_NOT_FOUND:${pid}`);

                          const dtype = String(prod.DiscountType || '').toLowerCase();
                          let unit = prod.Price;
                          let lineTotal;

                          if (dtype === 'percentage') {
                            unit = Math.max(0, Math.round(unit * (1 - prod.DiscountValue / 100) * 100) / 100);
                            lineTotal = Math.round(unit * qty * 100) / 100;
                          } else if (dtype === 'fixed') {
                            unit = Math.max(0, Math.round((unit - prod.DiscountValue) * 100) / 100);
                            lineTotal = Math.round(unit * qty * 100) / 100;
                          } else if (dtype === 'bogo') {
                            const X = 1, Y = 1;
                            const cycle = X + Y;
                            const cycles = Math.floor(qty / cycle);
                            const remainder = qty - cycles * cycle;
                            const chargeable = cycles * X + Math.min(remainder, X);
                            lineTotal = Math.round(chargeable * unit * 100) / 100;
                          } else {
                            lineTotal = Math.round(unit * qty * 100) / 100;
                          }

                          subtotal += lineTotal;

                          lines.push({
                            ProductID: pid,
                            Name: prod.Name,
                            Stock: prod.Stock,
                            Qty: qty,
                            OriginalPrice: prod.Price,
                            Price: unit,
                            LineTotal: lineTotal,
                            DiscountType: prod.DiscountType,
                            DiscountValue: prod.DiscountValue,
                          });
                        }

                        subtotal = Math.round(subtotal * 100) / 100;
                        const tax = Math.round(subtotal * Number(taxRate) * 100) / 100;
                        const total = Math.round((subtotal + tax) * 100) / 100;

                        const upsertAll = () => {
                          const removed = Array.from(prevMap.keys()).filter(pid => !nextMap.has(pid));
                          const deleteRemoved = (doneDel) => {
                            if (!removed.length) return doneDel();
                            conn.query(
                              `DELETE FROM RegisterItems WHERE RegisterListID = ? AND ProductID IN (${removed.map(()=>'?').join(',')})`,
                              [registerListId, ...removed],
                              (eDel) => doneDel(eDel || null)
                            );
                          };

                          deleteRemoved((eDel) => {
                            if (eDel) return conn.rollback(() => { conn.release(); cb(eDel); });
                            let done = 0;
                            const want = lines.length;
                            if (!want) {
                              return conn.commit((eC2) => {
                                if (eC2) return conn.rollback(() => { conn.release(); cb(eC2); });
                                conn.release();
                                cb(null, { RegisterListID: registerListId, subtotal, tax, total, items: lines });
                              });
                            }
                            const upsertOne = (line) => {
                              conn.query(
                                `INSERT INTO RegisterItems
                                   (RegisterListID, ProductID, Quantity, Price, DiscountType, DiscountValue)
                                 VALUES (?, ?, ?, ?, ?, ?)
                                 ON DUPLICATE KEY UPDATE
                                   Quantity=VALUES(Quantity),
                                   Price=VALUES(Price),
                                   DiscountType=VALUES(DiscountType),
                                   DiscountValue=VALUES(DiscountValue)`,
                                [registerListId, line.ProductID, line.Qty, line.Price, line.DiscountType, line.DiscountValue],
                                (eUp) => {
                                  if (eUp) return conn.rollback(() => { conn.release(); cb(eUp); });
                                  if (++done === want) {
                                    conn.commit((eC) => {
                                      if (eC) return conn.rollback(() => { conn.release(); cb(eC); });
                                      conn.release();
                                      cb(null, { RegisterListID: registerListId, subtotal, tax, total, items: lines });
                                    });
                                  }
                                }
                              );
                            };
                            for (const line of lines) upsertOne(line);
                          });
                        };

                        upsertAll();
                      } catch (ex) {
                        return conn.rollback(() => { conn.release(); cb(ex); });
                      }
                    };

                    stepStock();
                  }
                );
              };

              if (existingId) {
                continueWithList(existingId);
              } else {
                conn.query(
                  `INSERT INTO RegisterList (EmployeeID, CustomerID, GuestID, DateCreated)
                   VALUES (?, ?, ?, NOW())`,
                  [employeeId || null, cust, guest],
                  (eHead, regResult) => {
                    if (eHead) return conn.rollback(() => { conn.release(); cb(eHead); });
                    continueWithList(regResult.insertId);
                  }
                );
              }
            });
          }
        );
      } catch (ex) {
        conn.rollback(() => { conn.release(); cb(ex); });
      }
    });
  });
};

exports.getRegister = (registerListId, cb) => {
    db.query(
        `SELECT RegisterListID, CustomerID, EmployeeID, DateCreated
         FROM RegisterList
         WHERE RegisterListID = ?`,
        [registerListId],
        (e1, listRows) => {
            if (e1) return cb(e1);
            if (!listRows || listRows.length === 0) return cb(null, null);
            const list = listRows[0];

            db.query(
                `SELECT ri.ProductID,
                        ri.Quantity           AS Qty,
                        ri.Price              AS UnitPrice,          -- snapshot unit used for non-BOGO totals
                        ri.DiscountType       AS SavedType,          -- may be NULL for BOGO if enum omits it
                        ri.DiscountValue      AS SavedValue,
                        p.Price               AS OriginalUnit,       -- current product base for comparison label
                        p.Name                AS ProdName,
                        p.ImgPath,
                        p.ImgName
                 FROM RegisterItems ri
                          LEFT JOIN Products p ON ri.ProductID = p.ProductID
                 WHERE ri.RegisterListID = ?`,
                [registerListId],
                (e2, rows) => {
                    if (e2) return cb(e2);

                    let subtotal = 0;
                    let totalSaved = 0;

                    const items = rows.map(r => {
                        const qty = Number(r.Qty) || 0;
                        const unit = Number(r.UnitPrice) || 0;
                        const orig = Number(r.OriginalUnit) || unit;
                        const dtype = String(r.SavedType || '').toLowerCase();
                        const dval = r.SavedValue != null ? Number(r.SavedValue) : null;

                        let lineTotal = 0;
                        let savedAmount = 0;
                        let discountPercentLabel = null;

                        if (dtype === 'percentage') {
                            const perUnitSaved = Math.max(0, orig - unit);
                            savedAmount = Math.round(perUnitSaved * qty * 100) / 100;
                            lineTotal = Math.round(unit * qty * 100) / 100;
                            if (dval != null) discountPercentLabel = `${dval}% off`;
                        }else if (dtype === 'fixed') {
                            const perUnitSaved = Math.max(0, dval != null ? dval : (orig - unit));
                            savedAmount = Math.round(perUnitSaved * qty * 100) / 100;
                            lineTotal = Math.round(unit * qty * 100) / 100;
                            discountPercentLabel = perUnitSaved > 0
                                ? `$${perUnitSaved.toFixed(2)} off each`
                                : null;
                        } else if (dtype === 'bogo') {
                            const X = 1, Y = 1;
                            const cycle = X + Y;
                            const cycles = Math.floor(qty / cycle);
                            const remainder = qty - cycles * cycle;
                            const chargeable = cycles * X + Math.min(remainder, X);
                            lineTotal = Math.round(chargeable * orig * 100) / 100;
                            const regular = Math.round(orig * qty * 100) / 100;
                            savedAmount = Math.max(0, Math.round((regular - lineTotal) * 100) / 100);
                            discountPercentLabel = 'BOGO';
                        } else {
                            lineTotal = Math.round(unit * qty * 100) / 100;
                            savedAmount = Math.max(0, Math.round((orig * qty - lineTotal) * 100) / 100);
                            discountPercentLabel = (savedAmount > 0 && orig > 0)
                                ? `${Math.round((savedAmount / (orig * qty)) * 100)}% off`
                                : null;
                        }

                        subtotal = Math.round((subtotal + lineTotal) * 100) / 100;
                        totalSaved = Math.round((totalSaved + savedAmount) * 100) / 100;

                        return {
                            ProductID: r.ProductID,
                            Name: r.ProdName || '',
                            Qty: qty,
                            Price: unit,
                            OriginalPrice: orig,
                            LineTotal: lineTotal,
                            SavedAmount: savedAmount,
                            DiscountType: dtype || null,
                            DiscountValue: dval,
                            DiscountLabel: discountPercentLabel,
                            ImgPath: r.ImgPath || null,
                            ImgName: r.ImgName || null
                        };
                    });

                    const taxRate = 0;
                    const tax = Math.round(subtotal * taxRate * 100) / 100;
                    const total = Math.round((subtotal + tax) * 100) / 100;

                    cb(null, {
                        ...list,
                        subtotal,
                        discount: totalSaved,
                        tax,
                        total,
                        items
                    });
                }
            );
        }
    );
};

exports.removeRegisterItem = ({ registerListId, productId }, cb) => {
    db.getConnection((err, conn) => {
        if (err) return cb(err);

        conn.beginTransaction((errTx) => {
            if (errTx) {
                conn.release();
                return cb(errTx);
            }

            conn.query(
                `SELECT Quantity
                 FROM RegisterItems
                 WHERE RegisterListID = ? AND ProductID = ?`,
                [registerListId, productId],
                (eSel, rows) => {
                    if (eSel) {
                        return conn.rollback(() => {
                            conn.release();
                            cb(eSel);
                        });
                    }

                    if (rows.length === 0) {
                        conn.rollback(() => {
                            conn.release();
                            cb(new Error("Register item not found"));
                        });
                        return;
                    }

                    const qty = rows[0].Quantity;

                    conn.query(
                        `DELETE FROM RegisterItems
                         WHERE RegisterListID = ? AND ProductID = ?`,
                        [registerListId, productId],
                        (eDel) => {
                            if (eDel) {
                                return conn.rollback(() => {
                                    conn.release();
                                    cb(eDel);
                                });
                            }

                            conn.query(
                                `UPDATE Products
                                 SET Stock = Stock + ?
                                 WHERE ProductID = ?`,
                                [qty, productId],
                                (eUpd) => {
                                    if (eUpd) {
                                        return conn.rollback(() => {
                                            conn.release();
                                            cb(eUpd);
                                        });
                                    }

                                    conn.commit((eC) => {
                                        if (eC) {
                                            return conn.rollback(() => {
                                                conn.release();
                                                cb(eC);
                                            });
                                        }

                                        exports.getRegister(registerListId, (eGet, data) => {
                                            conn.release();
                                            if (eGet) return cb(eGet);
                                            cb(null, data);
                                        });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    });
};



exports.deleteRegisterList = ({ registerListId }, cb) => {
    db.getConnection((err, conn) => {
        if (err) return cb(err);

        conn.query(
            `DELETE FROM RegisterList WHERE RegisterListID = ?`,
            [registerListId],
            (eDel, result) => {
                conn.release();
                if (eDel) return cb(eDel);
                cb(null, result);
            }
        );
    });
};


exports.updateRegisterIdentity = ({ registerListId, customerId, guestId }, cb) => {
  const hasCust = customerId != null;
  const hasGuest = guestId != null;
  if ((hasCust && hasGuest) || (!hasCust && !hasGuest)) {
    return cb(new Error('BAD_PARAMS'));
  }

  const custVal = hasCust ? Number(customerId) : null;
  const guestVal = hasGuest ? Number(guestId) : null;

  db.getConnection((err, conn) => {
    if (err) return cb(err);
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return cb(errTx); }

      conn.query(
        `SELECT RegisterListID
         FROM RegisterList
         WHERE RegisterListID = ?
         FOR UPDATE`,
        [registerListId],
        (eSel, rows) => {
          if (eSel) return conn.rollback(() => { conn.release(); cb(eSel); });

          const exists = rows && rows.length > 0;

          const returnSnapshot = (id) => {
            conn.commit((eC) => {
              if (eC) return conn.rollback(() => { conn.release(); cb(eC); });
              exports.getRegister(id, (eGet, data) => {
                conn.release();
                if (eGet) return cb(eGet);
                cb(null, data);
              });
            });
          };

          if (exists) {
            conn.query(
              `UPDATE RegisterList
               SET CustomerID = ?, GuestID = ?
               WHERE RegisterListID = ?`,
              [custVal, guestVal, registerListId],
              (eU) => {
                if (eU) return conn.rollback(() => { conn.release(); cb(eU); });
                returnSnapshot(registerListId);
              }
            );
          } else {
            conn.query(
              `INSERT INTO RegisterList (EmployeeID, CustomerID, GuestID, DateCreated)
               VALUES (?, ?, ?, NOW())`,
              [null, custVal, guestVal],
              (eIns, resIns) => {
                if (eIns) return conn.rollback(() => { conn.release(); cb(eIns); });
                returnSnapshot(resIns.insertId);
              }
            );
          }
        }
      );
    });
  });
};

exports.listProductsForCashier = ({ search = '', category = null }, cb) => {
    const where = [];
    const args = [];

    const trimmed = String(search || '').trim();
    if (trimmed) {
        const isDigits = /^[0-9]+$/.test(trimmed);
        const likeTerm = `%${trimmed}%`;
        if (isDigits) {
            where.push('(p.Name LIKE ? OR p.ProductID = ? OR CAST(p.ProductID AS CHAR) LIKE ?)');
            args.push(likeTerm, Number(trimmed), likeTerm);
        } else {
            where.push('(p.Name LIKE ? OR CAST(p.ProductID AS CHAR) LIKE ?)');
            args.push(likeTerm, likeTerm);
        }
    }
    if (category != null && category !== '' && category !== 'All') {
        const catId = Number(category);
        if (Number.isFinite(catId)) {
            where.push('p.CategoryID = ?');
            args.push(catId);
        }
    }

    const sql = `
        SELECT
            p.ProductID,
            p.Name,
            p.Brand,
            p.Price AS OriginalPrice,
            CASE d.DiscountType
                WHEN 'percentage' THEN ROUND(p.Price * (1 - d.DiscountValue/100), 2)
                WHEN 'fixed'      THEN GREATEST(0, ROUND(p.Price - d.DiscountValue, 2))
                ELSE p.Price
                END AS FinalPrice,
            d.DiscountType,
            d.DiscountValue,
            p.ImgPath,
            p.Stock,
            p.ImgName,
            p.QuantityValue,
            p.QuantityUnit
        FROM Products p
                 LEFT JOIN Discounts d ON d.ProductID = p.ProductID
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY p.Name ASC
            LIMIT 200
    `;

    db.query(sql, args, (err, rows) => {
        if (err) return cb(err);
        cb(null, rows || []);
    });
};

exports.checkoutRegister = ({ registerListId, employeeId = null }, cb) => {
  db.getConnection((err, conn) => {
    if (err) return cb(err);
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return cb(errTx); }

      conn.query(
        `SELECT RegisterListID, CustomerID, GuestID, EmployeeID, DateCreated
         FROM RegisterList
         WHERE RegisterListID = ?
         FOR UPDATE`,
        [registerListId],
        (eHead, headRows) => {
          if (eHead) return conn.rollback(() => { conn.release(); cb(eHead); });
          if (!headRows || headRows.length === 0) {
            return conn.rollback(() => { conn.release(); cb(new Error('REGISTER_NOT_FOUND')); });
          }
          const head = headRows[0];

          conn.query(
            `SELECT ri.ProductID, ri.Quantity AS Qty, ri.Price, ri.DiscountType, ri.DiscountValue,
                    p.Price AS OriginalPrice
             FROM RegisterItems ri
             JOIN Products p ON p.ProductID = ri.ProductID
             WHERE ri.RegisterListID = ?
             FOR UPDATE`,
            [registerListId],
            (eItems, rows) => {
              if (eItems) return conn.rollback(() => { conn.release(); cb(eItems); });
              const items = rows || [];
              if (!items.length) {
                return conn.rollback(() => { conn.release(); cb(new Error('EMPTY_REGISTER')); });
              }

              const productIds = Array.from(new Set(items.map(r => Number(r.ProductID))));
              const loadDiscountIds = (done) => {
                if (!productIds.length) return done(null, new Map());
                const ph = productIds.map(() => '?').join(',');
                conn.query(
                  `SELECT ProductID, DiscountID
                   FROM Discounts
                   WHERE ProductID IN (${ph})`,
                  productIds,
                  (eDisc, discRows) => {
                    if (eDisc) return done(eDisc);
                    const discMap = new Map((discRows || []).map(dr => [Number(dr.ProductID), Number(dr.DiscountID)]));
                    done(null, discMap);
                  }
                );
              };

              loadDiscountIds((eLd, discMap) => {
                if (eLd) return conn.rollback(() => { conn.release(); cb(eLd); });

                const r2 = (n) => Math.round(n * 100) / 100;
                let subtotal = 0;
                let discountTotal = 0;

                for (const r of items) {
                  const qty = Number(r.Qty) || 0;
                  const unit = Number(r.Price) || 0;
                  const orig = Number(r.OriginalPrice) || 0;
                  const dtype = String(r.DiscountType || '').toLowerCase();

                  const lineTotal = r2(unit * qty);
                  subtotal += lineTotal;

                  let saved = 0;
                  if (dtype === 'bogo') {
                    const freeUnits = Math.floor(qty / 2);
                    saved = r2(freeUnits * orig);
                  } else {
                    const perUnitSave = Math.max(0, orig - unit);
                    saved = r2(perUnitSave * qty);
                  }
                  discountTotal += saved;
                }

                subtotal = r2(subtotal);
                discountTotal = r2(discountTotal);
                const taxRate = 0.0825;
                const tax = r2(subtotal * taxRate);
                const total = r2(subtotal + tax);

                const ord = {
                  CustomerID: head.CustomerID || null,
                  GuestID: head.CustomerID ? null : (head.GuestID || null),
                  EmployeeID: employeeId || head.EmployeeID || null,
                  Subtotal: subtotal,
                  DiscountTotal: discountTotal,
                  Tax: tax,
                  Total: total,
                  Status: 'Placed',
                };

                conn.query(
                  `INSERT INTO Orders
                   (CustomerID, GuestID, EmployeeID, Subtotal, DiscountTotal, Tax, Total, Status, DatePlaced)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                  [ord.CustomerID, ord.GuestID, ord.EmployeeID, ord.Subtotal, ord.DiscountTotal, ord.Tax, ord.Total, ord.Status],
                  (eIns, resIns) => {
                    if (eIns) return conn.rollback(() => { conn.release(); cb(eIns); });
                    const orderId = resIns.insertId;

                    let done = 0;
                    const want = items.length;

                    const insertDetail = (r) => {
                      const discountId = discMap.get(Number(r.ProductID)) || null;
                      conn.query(
                        `INSERT INTO OrderDetails
                           (OrderID, ProductID, Quantity, DiscountID, Price)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                          orderId,
                          Number(r.ProductID),
                          Number(r.Qty),
                          discountId,
                          Number(r.Price),
                        ],
                        (eD) => {
                          if (eD) return conn.rollback(() => { conn.release(); cb(eD); });
                          if (++done === want) finalize();
                        }
                      );
                    };

                    const finalize = () => {
                      conn.query(
                        `DELETE FROM RegisterItems WHERE RegisterListID = ?`,
                        [registerListId],
                        (eDelItems) => {
                          if (eDelItems) return conn.rollback(() => { conn.release(); cb(eDelItems); });
                          conn.query(
                            `DELETE FROM RegisterList WHERE RegisterListID = ?`,
                            [registerListId],
                            (eDelList) => {
                              if (eDelList) return conn.rollback(() => { conn.release(); cb(eDelList); });
                              conn.commit((eC) => {
                                if (eC) return conn.rollback(() => { conn.release(); cb(eC); });
                                conn.release();
                                cb(null, {
                                  OrderID: orderId,
                                  CustomerID: ord.CustomerID,
                                  GuestID: ord.GuestID,
                                  EmployeeID: ord.EmployeeID,
                                  subtotal: ord.Subtotal,
                                  discount: ord.DiscountTotal,
                                  tax: ord.Tax,
                                  total: ord.Total,
                                  Status: ord.Status,
                                });
                              });
                            }
                          );
                        }
                      );
                    };

                    for (const r of items) insertDetail(r);
                  }
                );
              });
            }
          );
        }
      );
    });
  });
};

exports.reassignOrderCustomer = ({ orderId, customerId }, cb) => {
    const sql = `UPDATE Orders SET CustomerID = ? WHERE OrderID = ?`;
    db.query(sql, [customerId, orderId], (err, r) => {
        if (err) return cb(err);
        cb(null, { ok: true, updated: r?.affectedRows || 0 });
    });
};

exports.getOrderReceipt = (orderId, cb) => {
    const id = Number(orderId);
    if (!Number.isFinite(id) || id <= 0) return cb(new Error('BAD_ORDER_ID'));

    db.query(
        `SELECT
             o.OrderID, o.CustomerID, o.GuestID, o.EmployeeID,
             o.Subtotal, o.DiscountTotal, o.Tax, o.Total, o.Status, o.DatePlaced,
             e.FirstName AS EmpFirst, e.LastName AS EmpLast, e.FirstName AS EmpUser
         FROM Orders o
                  LEFT JOIN Employees e ON e.EmployeeID = o.EmployeeID
         WHERE o.OrderID = ?
             FOR UPDATE`,
        [id],
        (eHead, headRows) => {
            if (eHead) return cb(eHead);
            if (!headRows || headRows.length === 0) return cb(null, null);

            const head = headRows[0];

            db.query(
                `SELECT
                     od.ProductID,
                     od.Quantity   AS Qty,
                     od.Price      AS Price,
                     p.Name        AS Name,
                     p.Price       AS OriginalPrice,
                     d.DiscountType,
                     d.DiscountValue
                 FROM OrderDetails od
                          JOIN Products p ON p.ProductID = od.ProductID
                          LEFT JOIN Discounts d ON d.DiscountID = od.DiscountID
                 WHERE od.OrderID = ?`,
                [id],
                (eItems, rows) => {
                    if (eItems) return cb(eItems);

                    const round2 = (n) => Math.round(n * 100) / 100;

                    const items = (rows || []).map(r => {
                        const qty = Number(r.Qty) || 0;
                        const unit = Number(r.Price) || 0;
                        const orig = Number(r.OriginalPrice) || 0;
                        const dtype = String(r.DiscountType || '').toLowerCase();
                        const dval = r.DiscountValue != null ? Number(r.DiscountValue) : null;

                        const lineTotal = round2(unit * qty);

                        let saved = 0;
                        if (dtype === 'bogo') {
                            const freeUnits = Math.floor(qty / 2);
                            saved = round2(freeUnits * orig);
                        } else {
                            const perUnitSave = Math.max(0, orig - unit);
                            saved = round2(perUnitSave * qty);
                        }

                        return {
                            ProductID: Number(r.ProductID),
                            Name: r.Name,
                            Qty: qty,
                            UnitPrice: unit,
                            OriginalPrice: orig,
                            LineTotal: lineTotal,
                            SavedAmount: saved,
                            DiscountType: dtype || null,
                            DiscountValue: Number.isFinite(dval) ? dval : null
                        };
                    });

                    let subtotal = Number(head.Subtotal);
                    let discountTotal = Number(head.DiscountTotal);
                    let tax = Number(head.Tax);
                    let total = Number(head.Total);

                    const needRecalc =
                        !Number.isFinite(subtotal) ||
                        !Number.isFinite(discountTotal) ||
                        !Number.isFinite(tax) ||
                        !Number.isFinite(total);

                    if (needRecalc) {
                        subtotal = round2(items.reduce((s, it) => s + (Number(it.LineTotal) || 0), 0));
                        discountTotal = round2(items.reduce((s, it) => s + (Number(it.SavedAmount) || 0), 0));
                        const taxRate = 0.0825;
                        tax = round2(subtotal * taxRate);
                        total = round2(subtotal + tax);
                    }

                    const loadName = (done) => {
                        if (head.CustomerID) {
                            db.query(
                                `SELECT FirstName, LastName, Points FROM Customers WHERE CustomerID = ?`,
                                [head.CustomerID],
                                (eC, rC) => {
                                    if (eC) return done(null, { name: null, points: 0 });
                                    if (rC && rC.length) {
                                        const c = rC[0];
                                        const full = [c.FirstName, c.LastName].filter(Boolean).join(' ').trim();
                                        return done(null, {
                                            name: full || 'Customer',
                                            points: c.Points || 0
                                        });
                                    }
                                    done(null, { name: 'Customer', points: 0 });
                                }
                            );
                        } else if (head.GuestID) {
                            done(null, { name: 'Guest', points: 0 });
                        } else {
                            done(null, { name: 'Guest', points: 0 });
                        }
                    };

                    loadName((_eN, customerData) => {
                        const cashierName = head.EmpFirst;

                        const payload = {
                            OrderID: Number(head.OrderID),
                            CustomerID: head.CustomerID ? Number(head.CustomerID) : null,
                            GuestID: head.GuestID ? Number(head.GuestID) : null,
                            EmployeeID: head.EmployeeID != null ? Number(head.EmployeeID) : null,
                            CashierName: cashierName,
                            Date: head.DatePlaced,
                            Status: head.Status || 'Placed',
                            CustomerName: customerData?.name || (head.CustomerID ? 'Customer' : 'Guest'),
                            CustomerPoints: customerData?.points || 0,
                            Subtotal: subtotal,
                            Discount: discountTotal,
                            Tax: tax,
                            Total: total,
                            Items: items
                        };

                        cb(null, payload);
                    });

                }
            );
        }
    );
};

exports.listProductsWithDiscount = (cb) => {
    const sql = `
        SELECT
            p.ProductID,
            p.Name,
            p.Brand,
            p.CategoryID,
            p.SupplierID,
            p.ImgName,
            p.ImgPath,
            p.Price AS OriginalPrice,
            p.Description,
            p.Stock,
            p.QuantityValue,
            p.QuantityUnit,
            d.DiscountType,
            d.DiscountValue,
            s.Name AS SupplierName,
            c.CategoryName,
            CASE
                WHEN d.DiscountType = 'percentage' THEN ROUND(p.Price * (1 - d.DiscountValue / 100), 2)
                WHEN d.DiscountType = 'fixed' THEN ROUND(GREATEST(p.Price - d.DiscountValue, 0), 2)
                ELSE p.Price
                END AS FinalPrice
        FROM Products p
                 LEFT JOIN Discounts d
                           ON p.ProductID = d.ProductID
                 LEFT JOIN SaleEvents e
                           ON d.SaleEventID = e.SaleEventID
                               AND CURDATE() BETWEEN e.StartDate AND e.EndDate
                 LEFT JOIN Categories c
                           ON p.CategoryID = c.CategoryID
                 LEFT JOIN Suppliers s
                           ON p.SupplierID = s.SupplierID;
    `;
    db.query(sql, (err, rows) => cb(err, rows));
};