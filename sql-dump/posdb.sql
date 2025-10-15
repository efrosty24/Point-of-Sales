-- MySQL dump 10.13  Distrib 9.4.0, for macos26.0 (arm64)
--
-- Host: localhost    Database: posdb
-- ------------------------------------------------------
-- Server version	9.4.0

CREATE DATABASE IF NOT EXISTS `posdb`;
USE `posdb`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Categories`
--

DROP TABLE IF EXISTS `Categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Categories` (
  `CategoryID` bigint NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(100) NOT NULL,
  PRIMARY KEY (`CategoryID`),
  UNIQUE KEY `CategoryName` (`CategoryName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Categories`
--

LOCK TABLES `Categories` WRITE;
/*!40000 ALTER TABLE `Categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `Categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Customers`
--

DROP TABLE IF EXISTS `Customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customers` (
  `CustomerID` bigint NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `Zip` varchar(10) DEFAULT NULL,
  `Country` varchar(100) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`CustomerID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customers`
--

LOCK TABLES `Customers` WRITE;
/*!40000 ALTER TABLE `Customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `Customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Discounts`
--

DROP TABLE IF EXISTS `Discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Discounts` (
  `DiscountID` bigint NOT NULL AUTO_INCREMENT,
  `SaleEventID` bigint NOT NULL,
  `ProductID` bigint NOT NULL,
  `DiscountType` enum('percentage','fixed','bogo') NOT NULL,
  `DiscountValue` decimal(10,2) NOT NULL,
  `Conditions` text,
  PRIMARY KEY (`DiscountID`),
  KEY `fk_discounts_event` (`SaleEventID`),
  KEY `fk_discounts_product` (`ProductID`),
  CONSTRAINT `fk_discounts_event` FOREIGN KEY (`SaleEventID`) REFERENCES `SaleEvents` (`SaleEventID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_discounts_product` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Discounts`
--

LOCK TABLES `Discounts` WRITE;
/*!40000 ALTER TABLE `Discounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `Discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Employees`
--

DROP TABLE IF EXISTS `Employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Employees` (
  `EmployeeID` bigint NOT NULL AUTO_INCREMENT,
  `UserPassword` varchar(255) NOT NULL,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `Zip` varchar(10) DEFAULT NULL,
  `Country` varchar(100) DEFAULT NULL,
  `Email` varchar(255) NOT NULL,
  `Role` enum('Cashier','Admin') NOT NULL,
  PRIMARY KEY (`EmployeeID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Employees`
--

LOCK TABLES `Employees` WRITE;
/*!40000 ALTER TABLE `Employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `Employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `OrderDetails`
--

DROP TABLE IF EXISTS `OrderDetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OrderDetails` (
  `OrderDetailID` bigint NOT NULL AUTO_INCREMENT,
  `OrderID` bigint NOT NULL,
  `ProductID` bigint NOT NULL,
  `Quantity` int NOT NULL,
  `DiscountID` bigint DEFAULT NULL,
  `Price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`OrderDetailID`),
  KEY `fk_orderdetails_order` (`OrderID`),
  KEY `fk_orderdetails_product` (`ProductID`),
  KEY `fk_orderdetails_discount` (`DiscountID`),
  CONSTRAINT `fk_orderdetails_discount` FOREIGN KEY (`DiscountID`) REFERENCES `Discounts` (`DiscountID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orderdetails_order` FOREIGN KEY (`OrderID`) REFERENCES `Orders` (`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orderdetails_product` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `OrderDetails`
--

LOCK TABLES `OrderDetails` WRITE;
/*!40000 ALTER TABLE `OrderDetails` DISABLE KEYS */;
/*!40000 ALTER TABLE `OrderDetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Orders`
--

DROP TABLE IF EXISTS `Orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Orders` (
  `OrderID` bigint NOT NULL AUTO_INCREMENT,
  `CustomerID` bigint NOT NULL,
  `EmployeeID` bigint NOT NULL,
  `Subtotal` decimal(10,2) NOT NULL,
  `Tax` decimal(10,2) NOT NULL,
  `Total` decimal(10,2) NOT NULL,
  `Status` varchar(50) DEFAULT 'pending',
  `DatePlaced` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`OrderID`),
  KEY `fk_orders_customer` (`CustomerID`),
  KEY `fk_orders_employee` (`EmployeeID`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`CustomerID`) REFERENCES `Customers` (`CustomerID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_employee` FOREIGN KEY (`EmployeeID`) REFERENCES `Employees` (`EmployeeID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Orders`
--

LOCK TABLES `Orders` WRITE;
/*!40000 ALTER TABLE `Orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `Orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Products`
--

DROP TABLE IF EXISTS `Products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Products` (
  `ProductID` bigint NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Brand` varchar(100) DEFAULT NULL,
  `CategoryID` bigint NOT NULL,
  `SupplierID` bigint NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `IsPricePerQty` tinyint(1) NOT NULL,
  `Description` text,
  `Stock` bigint NOT NULL,
  `ReorderThreshold` int NOT NULL,
  `QuantityValue` decimal(10,2) NOT NULL,
  `QuantityUnit` varchar(50) NOT NULL,
  `ImgName` varchar(255) DEFAULT NULL,
  `ImgPath` varchar(255) DEFAULT NULL,
  `DateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ProductID`),
  KEY `fk_products_category` (`CategoryID`),
  KEY `fk_products_supplier` (`SupplierID`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`CategoryID`) REFERENCES `Categories` (`CategoryID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_products_supplier` FOREIGN KEY (`SupplierID`) REFERENCES `Suppliers` (`SupplierID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Products`
--

LOCK TABLES `Products` WRITE;
/*!40000 ALTER TABLE `Products` DISABLE KEYS */;
/*!40000 ALTER TABLE `Products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RegisterItems`
--

DROP TABLE IF EXISTS `RegisterItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RegisterItems` (
  `RegisterItemID` bigint NOT NULL AUTO_INCREMENT,
  `RegisterListID` bigint NOT NULL,
  `ProductID` bigint NOT NULL,
  `Quantity` int NOT NULL,
  PRIMARY KEY (`RegisterItemID`),
  UNIQUE KEY `uq_registeritems_list_product` (`RegisterListID`,`ProductID`),
  KEY `fk_registeritems_product` (`ProductID`),
  CONSTRAINT `fk_registeritems_list` FOREIGN KEY (`RegisterListID`) REFERENCES `RegisterList` (`RegisterListID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_registeritems_product` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RegisterItems`
--

LOCK TABLES `RegisterItems` WRITE;
/*!40000 ALTER TABLE `RegisterItems` DISABLE KEYS */;
/*!40000 ALTER TABLE `RegisterItems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RegisterList`
--

DROP TABLE IF EXISTS `RegisterList`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RegisterList` (
  `RegisterListID` bigint NOT NULL AUTO_INCREMENT,
  `EmployeeID` bigint NOT NULL,
  `CustomerID` bigint NOT NULL,
  `DateCreated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RegisterListID`),
  KEY `fk_registerlist_employee` (`EmployeeID`),
  KEY `fk_registerlist_customer` (`CustomerID`),
  CONSTRAINT `fk_registerlist_customer` FOREIGN KEY (`CustomerID`) REFERENCES `Customers` (`CustomerID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_registerlist_employee` FOREIGN KEY (`EmployeeID`) REFERENCES `Employees` (`EmployeeID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RegisterList`
--

LOCK TABLES `RegisterList` WRITE;
/*!40000 ALTER TABLE `RegisterList` DISABLE KEYS */;
/*!40000 ALTER TABLE `RegisterList` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RestockOrders`
--

DROP TABLE IF EXISTS `RestockOrders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RestockOrders` (
  `RestockOrderID` bigint NOT NULL AUTO_INCREMENT,
  `ProductID` bigint NOT NULL,
  `SupplierID` bigint NOT NULL,
  `Quantity` bigint NOT NULL,
  `Status` varchar(50) DEFAULT 'pending',
  `DatePlaced` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RestockOrderID`),
  KEY `fk_restockorders_product` (`ProductID`),
  KEY `fk_restockorders_supplier` (`SupplierID`),
  CONSTRAINT `fk_restockorders_product` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_restockorders_supplier` FOREIGN KEY (`SupplierID`) REFERENCES `Suppliers` (`SupplierID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RestockOrders`
--

LOCK TABLES `RestockOrders` WRITE;
/*!40000 ALTER TABLE `RestockOrders` DISABLE KEYS */;
/*!40000 ALTER TABLE `RestockOrders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SaleEvents`
--

DROP TABLE IF EXISTS `SaleEvents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SaleEvents` (
  `SaleEventID` bigint NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Description` text,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  PRIMARY KEY (`SaleEventID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SaleEvents`
--

LOCK TABLES `SaleEvents` WRITE;
/*!40000 ALTER TABLE `SaleEvents` DISABLE KEYS */;
/*!40000 ALTER TABLE `SaleEvents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Suppliers`
--

DROP TABLE IF EXISTS `Suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Suppliers` (
  `SupplierID` bigint NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`SupplierID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Suppliers`
--

LOCK TABLES `Suppliers` WRITE;
/*!40000 ALTER TABLE `Suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `Suppliers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-04 17:06:01
