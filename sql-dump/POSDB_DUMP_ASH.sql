-- MySQL dump 10.13  Distrib 9.4.0, for macos26.0 (arm64)
--
-- Host: localhost    Database: POSDB
-- ------------------------------------------------------
-- Server version	9.4.0

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Categories`
--

LOCK TABLES `Categories` WRITE;
/*!40000 ALTER TABLE `Categories` DISABLE KEYS */;
INSERT INTO `Categories` VALUES (4,'Bakery'),(3,'Dairy'),(1,'Fruits'),(5,'Grains'),(6,'Pantry'),(7,'Snacks'),(2,'Vegetables');
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
  `isActive` tinyint DEFAULT '1',
  `Points` int DEFAULT '0',
  PRIMARY KEY (`CustomerID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customers`
--

LOCK TABLES `Customers` WRITE;
/*!40000 ALTER TABLE `Customers` DISABLE KEYS */;
INSERT INTO `Customers` VALUES (1000,'Guest','P','1234567890','1','Katy','TX','77663','US','test@t',1,206),(1001,'Ash','','9999999999',NULL,NULL,NULL,NULL,NULL,NULL,1,0),(1002,'HELLO','TEST','2223334445','testADD','CITY','STATE','123456','US','test@223344.com',1,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Discounts`
--

LOCK TABLES `Discounts` WRITE;
/*!40000 ALTER TABLE `Discounts` DISABLE KEYS */;
INSERT INTO `Discounts` VALUES (6,1,61,'percentage',15.00,'Applies to Bananas only'),(7,1,62,'percentage',10.00,'Applies to Apples only'),(8,1,63,'percentage',12.00,'Applies to Oranges only'),(9,2,65,'fixed',0.50,'Discount per bunch of Spinach'),(10,3,70,'bogo',0.00,'Buy 1 Whole Milk, get 1 free');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Employees`
--

LOCK TABLES `Employees` WRITE;
/*!40000 ALTER TABLE `Employees` DISABLE KEYS */;
INSERT INTO `Employees` VALUES (1,'Admin@7','System','Test','0000000000','123 Admin Street','Houston','TX','77001','USA','admin@pos.lcom','Admin'),(3,'Emp@7','System','Employee','0000000000','123 Admin Street','Houston','TX','77001','USA','emp@pos.lcom','Cashier');
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
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `OrderDetails`
--

LOCK TABLES `OrderDetails` WRITE;
/*!40000 ALTER TABLE `OrderDetails` DISABLE KEYS */;
INSERT INTO `OrderDetails` VALUES (1,1,71,1,NULL,4.49),(2,1,78,1,NULL,7.99),(3,2,61,2,NULL,0.67),(4,2,63,2,NULL,0.97),(5,2,70,2,NULL,3.29),(6,2,74,2,NULL,2.49),(7,2,78,2,NULL,7.99),(8,3,61,1,6,0.67),(9,3,62,1,7,1.16),(10,3,63,1,8,0.97),(11,3,66,1,NULL,0.89),(12,4,61,1,6,0.67),(13,4,62,1,7,1.16),(14,4,63,1,8,0.97),(15,4,74,1,NULL,2.49),(16,5,66,1,NULL,0.89),(17,6,66,1,NULL,0.89),(18,7,66,1,NULL,0.89),(19,8,73,1,NULL,3.79),(20,9,73,1,NULL,3.79),(21,10,66,1,NULL,0.89),(22,11,61,1,6,0.67),(23,11,62,1,7,1.16),(24,11,63,4,8,0.97),(25,11,66,2,NULL,0.89),(26,11,78,1,NULL,7.99),(27,12,66,1,NULL,0.89),(28,13,66,1,NULL,0.89),(29,14,66,1,NULL,0.89),(30,15,66,1,NULL,0.89),(31,16,73,1,NULL,3.79),(32,17,66,1,NULL,0.89),(33,18,66,1,NULL,0.89),(34,19,66,1,NULL,0.89),(35,20,66,1,NULL,0.89),(36,21,66,1,NULL,0.89),(37,22,66,1,NULL,0.89),(38,23,66,1,NULL,0.89),(39,24,73,1,NULL,3.79),(40,25,66,1,NULL,0.89),(41,26,66,1,NULL,0.89),(42,27,63,1,8,0.97),(43,28,61,1,6,0.67),(44,28,62,1,7,1.16),(45,28,68,1,NULL,0.99),(46,28,75,1,NULL,2.99),(47,29,74,1,NULL,2.49),(48,30,63,1,8,0.97),(49,31,73,1,NULL,3.79),(50,32,73,1,NULL,3.79),(51,33,74,1,NULL,2.49),(52,34,63,1,8,0.97),(53,35,74,1,NULL,2.49),(54,36,74,1,NULL,2.49),(55,37,61,1,6,0.67),(56,37,63,1,8,0.97),(57,37,66,1,NULL,0.89),(58,37,75,1,NULL,2.99),(59,38,63,1,8,0.97),(60,38,66,1,NULL,0.89),(61,39,74,1,NULL,2.49),(62,40,78,1,NULL,7.99),(63,41,73,1,NULL,3.79),(64,42,73,1,NULL,3.79),(65,43,73,1,NULL,3.79),(66,44,61,1,6,0.67),(67,45,73,1,NULL,3.79),(68,46,73,1,NULL,3.79),(69,47,78,1,NULL,7.99),(70,48,78,1,NULL,7.99),(71,49,73,1,NULL,3.79),(72,50,78,1,NULL,7.99),(73,51,73,1,NULL,3.79),(74,52,66,1,NULL,0.89),(75,52,71,1,NULL,4.49),(76,52,73,1,NULL,3.79),(77,52,74,1,NULL,2.49),(78,53,61,1,6,0.67),(79,53,74,1,NULL,2.49),(80,54,66,1,NULL,0.89),(81,55,63,1,8,0.97),(82,56,66,1,NULL,0.89),(83,57,74,1,NULL,2.49),(84,58,73,1,NULL,3.79),(85,59,61,1,6,0.67),(86,59,62,1,7,1.16),(87,59,65,1,9,1.49),(88,59,70,1,10,3.29),(89,60,70,2,10,3.29),(90,61,74,1,NULL,2.49),(91,62,74,3,NULL,2.49),(92,63,61,1,6,0.67),(93,63,73,1,NULL,3.79),(94,63,74,1,NULL,2.49),(95,64,73,1,NULL,3.79),(96,65,66,25,NULL,0.89),(97,65,73,32,NULL,3.79),(98,65,74,32,NULL,2.49),(99,66,78,1,NULL,7.99),(100,67,61,1,6,0.67),(101,68,68,1,NULL,0.99),(102,69,63,5,8,0.97),(103,70,61,3,6,0.67),(104,71,63,6,8,0.97),(105,72,78,1,NULL,7.99),(106,73,68,6,NULL,0.99),(107,74,68,6,NULL,0.99),(108,75,61,1,6,0.67),(109,75,62,1,7,1.16),(110,75,63,1,8,0.97),(111,75,71,1,NULL,4.49),(112,76,64,14,NULL,3.49),(113,76,74,10,NULL,2.49),(114,77,64,12,NULL,3.49);
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
  `CustomerID` bigint DEFAULT NULL,
  `GuestID` bigint DEFAULT NULL,
  `EmployeeID` bigint NOT NULL,
  `Subtotal` decimal(10,2) NOT NULL,
  `DiscountTotal` decimal(10,2) DEFAULT NULL,
  `Tax` decimal(10,2) NOT NULL,
  `Total` decimal(10,2) NOT NULL,
  `Status` varchar(50) DEFAULT 'pending',
  `DatePlaced` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`OrderID`),
  KEY `fk_orders_employee` (`EmployeeID`),
  KEY `fk_orders_customer` (`CustomerID`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`CustomerID`) REFERENCES `Customers` (`CustomerID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_employee` FOREIGN KEY (`EmployeeID`) REFERENCES `Employees` (`EmployeeID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Orders`
--

LOCK TABLES `Orders` WRITE;
/*!40000 ALTER TABLE `Orders` DISABLE KEYS */;
INSERT INTO `Orders` VALUES (1,NULL,8770018495702441,3,12.48,0.00,1.03,13.51,'Placed','2025-10-26 19:59:45'),(2,NULL,4599466902373075,3,30.82,3.79,2.54,33.36,'Placed','2025-10-26 20:00:24'),(3,NULL,6232252668016500,3,3.69,0.38,0.30,3.99,'Placed','2025-10-26 20:05:06'),(4,NULL,3869806121218362,3,5.29,0.38,0.44,5.73,'Placed','2025-10-26 20:05:26'),(5,1001,NULL,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 20:06:39'),(6,NULL,1027399213047403,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 20:06:59'),(7,1001,NULL,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 20:12:18'),(8,1001,NULL,3,3.79,0.00,0.31,4.10,'Placed','2025-10-26 20:13:36'),(9,1000,NULL,3,3.79,0.00,0.31,4.10,'Placed','2025-10-26 20:19:19'),(10,NULL,619659336593035,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 20:35:03'),(11,1001,NULL,3,15.48,0.77,1.28,16.76,'Placed','2025-10-26 22:37:42'),(12,NULL,8967236698669156,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 22:43:25'),(13,NULL,4191326387416732,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 22:44:36'),(14,NULL,2065597837108340,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 22:51:07'),(15,NULL,7307169495165996,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:00:42'),(16,NULL,1647507515524371,3,3.79,0.00,0.31,4.10,'Placed','2025-10-26 23:07:27'),(17,NULL,3086183090090600,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:10:28'),(18,NULL,8566380874980630,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:10:33'),(19,NULL,4483013156363869,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:15:40'),(20,NULL,7820073240886628,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:16:03'),(21,NULL,1111439901844277,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:18:43'),(22,NULL,2861619096047473,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:19:00'),(23,NULL,7355444516817537,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:28:58'),(24,NULL,2566658804031039,3,3.79,0.00,0.31,4.10,'Placed','2025-10-26 23:29:03'),(25,NULL,2258516194507230,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:29:14'),(26,NULL,8087183344338639,3,0.89,0.00,0.07,0.96,'Placed','2025-10-26 23:30:24'),(27,NULL,5332380718700709,3,0.97,0.13,0.08,1.05,'Placed','2025-10-26 23:42:38'),(28,NULL,7544150270452811,3,5.81,0.25,0.48,6.29,'Placed','2025-10-26 23:42:46'),(29,NULL,3926919210591671,3,2.49,0.00,0.21,2.70,'Placed','2025-10-26 23:47:08'),(30,NULL,5327486885423948,3,0.97,0.13,0.08,1.05,'Placed','2025-10-26 23:52:46'),(31,NULL,352359130336693,3,3.79,0.00,0.31,4.10,'Placed','2025-10-26 23:56:42'),(32,NULL,6219352202157406,3,3.79,0.00,0.31,4.10,'Placed','2025-10-26 23:58:08'),(33,NULL,8820417193854582,3,2.49,0.00,0.21,2.70,'Placed','2025-10-26 23:59:06'),(34,NULL,4829437698773781,3,0.97,0.13,0.08,1.05,'Placed','2025-10-26 23:59:25'),(35,NULL,621613633624865,3,2.49,0.00,0.21,2.70,'Placed','2025-10-27 00:03:34'),(36,NULL,6311624443645550,3,2.49,0.00,0.21,2.70,'Placed','2025-10-27 00:04:26'),(37,NULL,198801152283037,3,5.52,0.25,0.46,5.98,'Placed','2025-10-27 00:05:17'),(38,NULL,389400334407430,3,1.86,0.13,0.15,2.01,'Placed','2025-10-27 00:07:14'),(39,NULL,3157515386425914,3,2.49,0.00,0.21,2.70,'Placed','2025-10-27 00:08:13'),(40,NULL,4753441967944182,3,7.99,0.00,0.66,8.65,'Placed','2025-10-27 00:08:38'),(41,NULL,6982331335178883,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:13:26'),(42,NULL,8128633994574447,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:13:49'),(43,NULL,8558512868115050,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:14:43'),(44,NULL,1835561837393482,3,0.67,0.12,0.06,0.73,'Placed','2025-10-27 00:15:27'),(45,NULL,711956368591826,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:16:38'),(46,NULL,8732166223351938,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:17:38'),(47,NULL,270323007600062,3,7.99,0.00,0.66,8.65,'Placed','2025-10-27 00:17:51'),(48,NULL,7462757818106025,3,7.99,0.00,0.66,8.65,'Placed','2025-10-27 00:18:19'),(49,NULL,1956442519397650,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:20:19'),(50,NULL,5744811439975498,3,7.99,0.00,0.66,8.65,'Placed','2025-10-27 00:21:23'),(51,NULL,7799256165621742,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:22:54'),(52,NULL,2529332755786162,3,11.66,0.00,0.96,12.62,'Placed','2025-10-27 00:44:59'),(53,1001,NULL,3,3.16,0.12,0.26,3.42,'Placed','2025-10-27 00:45:13'),(54,NULL,8655322277410176,3,0.89,0.00,0.07,0.96,'Placed','2025-10-27 00:46:07'),(55,NULL,5568070319140797,3,0.97,0.13,0.08,1.05,'Placed','2025-10-27 00:46:19'),(56,1001,NULL,3,0.89,0.00,0.07,0.96,'Placed','2025-10-27 00:46:28'),(57,NULL,4625628854384961,3,2.49,0.00,0.21,2.70,'Placed','2025-10-27 00:47:14'),(58,1001,NULL,3,3.79,0.00,0.31,4.10,'Placed','2025-10-27 00:47:24'),(59,NULL,596681900498149,3,6.61,0.75,0.55,7.16,'Placed','2025-10-27 00:47:31'),(60,NULL,2577982939709723,3,6.58,3.29,0.54,7.12,'Placed','2025-10-27 00:47:36'),(61,NULL,3527591240273019,3,2.49,0.00,0.21,2.70,'Placed','2025-10-29 00:10:31'),(62,NULL,1540375832803260,3,7.47,0.00,0.62,8.09,'Placed','2025-11-01 19:41:36'),(63,NULL,5586261389733372,3,6.95,0.12,0.57,7.52,'Placed','2025-11-01 19:41:45'),(64,1000,NULL,3,3.79,0.00,0.31,4.10,'Placed','2025-11-03 21:15:20'),(65,1000,NULL,3,223.21,0.00,18.41,241.62,'Placed','2025-11-03 21:19:11'),(66,1000,NULL,3,7.99,0.00,0.66,8.65,'Placed','2025-11-03 21:20:55'),(67,1000,NULL,3,0.67,0.12,0.06,0.73,'Placed','2025-11-03 21:23:58'),(68,1000,NULL,3,0.99,0.00,0.08,1.07,'Placed','2025-11-03 21:35:13'),(69,1000,NULL,3,4.85,0.65,0.40,5.25,'Placed','2025-11-04 00:02:39'),(70,1000,NULL,3,2.01,0.36,0.17,2.18,'Placed','2025-11-04 00:26:11'),(71,1000,NULL,3,5.82,5.78,0.48,0.52,'Placed','2025-11-04 00:26:28'),(72,1000,NULL,3,7.99,5.00,0.66,3.65,'Placed','2025-11-04 00:29:16'),(73,1000,NULL,3,5.94,5.00,0.49,1.43,'Placed','2025-11-04 14:00:52'),(74,1000,NULL,3,5.94,5.00,0.49,1.43,'Placed','2025-11-04 14:01:56'),(75,1000,NULL,3,7.29,5.38,0.60,2.51,'Placed','2025-11-04 14:11:22'),(76,NULL,5782943319237615,3,73.76,0.00,6.09,79.85,'Placed','2025-11-06 17:05:07'),(77,1000,NULL,3,41.88,5.00,3.46,40.34,'Placed','2025-11-06 18:11:54');
/*!40000 ALTER TABLE `Orders` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `redeem_points_before_order` BEFORE INSERT ON `orders` FOR EACH ROW BEGIN
    DECLARE currentPoints INT DEFAULT 0;

    -- Only proceed if CustomerID is valid
    IF NEW.CustomerID IS NOT NULL THEN
        SELECT Points INTO currentPoints
        FROM Customers
        WHERE CustomerID = NEW.CustomerID
        FOR UPDATE;

        -- Redeem 500 points for a $5 discount if conditions met
        IF currentPoints >= 500 AND NEW.Subtotal >= 5 THEN
            SET NEW.DiscountTotal = COALESCE(NEW.DiscountTotal, 0) + 5;
            SET NEW.Total = (NEW.Subtotal - NEW.DiscountTotal) + COALESCE(NEW.Tax, 0);

            UPDATE Customers
            SET Points = Points - 500
            WHERE CustomerID = NEW.CustomerID;
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `add_points_after_order` AFTER INSERT ON `orders` FOR EACH ROW BEGIN
    -- Only reward points if the order has a valid CustomerID
    IF NEW.CustomerID IS NOT NULL THEN
        UPDATE Customers
        SET Points = Points + (FLOOR(NEW.Subtotal) * 5)
        WHERE CustomerID = NEW.CustomerID;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Products`
--

LOCK TABLES `Products` WRITE;
/*!40000 ALTER TABLE `Products` DISABLE KEYS */;
INSERT INTO `Products` VALUES (61,'Bananas','FreshCo',1,1,0.79,1,'Fresh ripe bananas, rich in potassium and fiber.',31,20,1.00,'kg','bananas.jpg','/products/','2025-10-26 10:31:05'),(62,'Apples','GoodFarm',1,1,1.29,1,'Crisp red apples sourced locally for daily freshness.',43,25,1.00,'kg','apples.jpg','/products/','2025-10-26 10:31:05'),(63,'Oranges','CitrusCo',1,1,1.10,1,'Juicy oranges packed with vitamin C.',21,15,1.00,'kg','oranges.jpg','/products/','2025-10-26 10:31:05'),(64,'Strawberries','FarmJoy',1,2,3.49,1,'Sweet strawberries ideal for desserts and smoothies.',0,10,500.00,'g','strawberries.jpg','/products/','2025-10-26 10:31:05'),(65,'Spinach','GreenLeaf',2,2,1.99,1,'Fresh organic spinach leaves full of nutrients.',49,15,1.00,'bunch','spinach.jpg','/products/','2025-10-26 10:31:05'),(66,'Carrots','DailyMart',2,1,0.89,1,'Crunchy orange carrots great for cooking or snacking.',45,30,1.00,'kg','carrots.jpg','/products/','2025-10-26 10:31:05'),(67,'Tomatoes','FreshCo',1,2,1.39,1,'Red juicy tomatoes perfect for salads and sauces.',61,25,1.00,'kg','tomatoes.jpg','/products/','2025-10-26 10:31:05'),(68,'Onions','GoodFarm',2,2,0.99,1,'Golden onions with strong flavor and aroma.',36,25,1.00,'kg','onions.jpg','/products/','2025-10-26 10:31:05'),(69,'Potatoes','DailyMart',2,3,0.79,1,'High-quality white potatoes suitable for any recipe.',50,40,1.00,'kg','potatoes.jpg','/products/','2025-10-26 10:31:05'),(70,'Whole Milk','DairyPure',3,3,3.29,1,'Pasteurized whole milk, rich and creamy.',45,15,1.00,'L','milk.jpg','/products/','2025-10-26 10:31:05'),(71,'Cheddar Cheese','CheeseCo',3,3,4.49,1,'Sharp cheddar cheese with rich texture and flavor.',46,10,200.00,'g','cheddar.jpg','/products/','2025-10-26 10:31:05'),(72,'Yogurt','FarmJoy',3,4,0.99,1,'Plain yogurt made with natural cultures.',14,15,1.00,'cup','yogurt.jpg','/products/','2025-10-26 10:31:05'),(73,'Butter','DairyPure',3,3,3.79,1,'Creamy salted butter from fresh cream.',22,10,250.00,'g','butter.jpg','/products/','2025-10-26 10:31:05'),(74,'Bread','BakeHouse',4,4,2.49,1,'Soft white sandwich bread freshly baked daily.',16,15,1.00,'loaf','bread.jpg','/products/','2025-10-26 10:31:05'),(75,'Eggs','FreshNest',3,4,2.99,1,'Farm fresh eggs rich in protein.',47,20,12.00,'pcs','eggs.jpg','/products/','2025-10-26 10:31:05'),(76,'Rice','GoldenGrain',5,5,6.49,1,'Long grain white rice, soft and fluffy after cooking.',50,30,5.00,'kg','rice.jpg','/products/','2025-10-26 10:31:05'),(77,'Pasta','Italico',5,5,1.99,1,'Durum wheat pasta ideal for Italian dishes.',50,25,500.00,'g','pasta.jpg','/products/','2025-10-26 10:31:05'),(78,'Olive Oil','Oliva',6,6,7.99,1,'Extra virgin olive oil cold-pressed for purity.',37,10,1.00,'L','olive_oil.jpg','/products/','2025-10-26 10:31:05'),(79,'Salt','PureLife',6,6,0.59,1,'Refined iodized salt for everyday cooking.',50,40,1.00,'kg','salt.jpg','/products/','2025-10-26 10:31:05'),(80,'Potato Chips','SnackWave',7,7,2.29,1,'Crispy salted potato chips in family-size bag.',50,15,1.00,'bag','chips.jpg','/products/','2025-10-26 10:31:05');
/*!40000 ALTER TABLE `Products` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `check_stock_below_threshold` AFTER UPDATE ON `products` FOR EACH ROW BEGIN
    DECLARE existingCount INT;
    DECLARE supplierId BIGINT;
    DECLARE reorderQty INT;

    -- Get values from the updated product row
    SET supplierId = NEW.SupplierID;
    SET reorderQty = NEW.ReorderThreshold;

    -- Check if a restock order already exists for this product
    SELECT COUNT(*) INTO existingCount
    FROM RestockOrders
    WHERE ProductID = NEW.ProductID
      AND Status NOT IN ('pending', 'read');

    -- Only insert a new restock order if stock drops below threshold and no active one exists
    IF NEW.Stock < NEW.ReorderThreshold
       AND OLD.Stock >= OLD.ReorderThreshold
       AND existingCount = 0 THEN
        INSERT INTO RestockOrders (ProductID, SupplierID, Quantity, Status, DatePlaced)
        VALUES (NEW.ProductID, supplierId, reorderQty, 'pending', NOW());
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_restock_status` AFTER UPDATE ON `products` FOR EACH ROW BEGIN
    IF NEW.Stock > OLD.Stock THEN
        UPDATE RestockOrders
        SET Status = 'complete'
        WHERE ProductID = NEW.ProductID
          AND Status = 'pending'
          AND NEW.Stock < NEW.ReorderThreshold;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_restock_complete` AFTER UPDATE ON `products` FOR EACH ROW BEGIN
    -- Only act if stock increased from below threshold
    IF OLD.Stock < OLD.ReorderThreshold AND NEW.Stock >= OLD.ReorderThreshold THEN
        -- Update all pending or read restock orders for this product to 'complete'
        UPDATE RestockOrders
        SET Status = 'complete'
        WHERE ProductID = NEW.ProductID
          AND Status IN ('pending', 'read');
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
  `Price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `DiscountType` enum('percentage','fixed','bogo') DEFAULT NULL,
  `DiscountValue` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`RegisterItemID`),
  UNIQUE KEY `uq_registeritems_list_product` (`RegisterListID`,`ProductID`),
  UNIQUE KEY `uq_register_product` (`RegisterListID`,`ProductID`),
  KEY `fk_registeritems_product` (`ProductID`),
  CONSTRAINT `fk_registeritems_list` FOREIGN KEY (`RegisterListID`) REFERENCES `RegisterList` (`RegisterListID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_registeritems_product` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4020 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RegisterItems`
--

LOCK TABLES `RegisterItems` WRITE;
/*!40000 ALTER TABLE `RegisterItems` DISABLE KEYS */;
INSERT INTO `RegisterItems` VALUES (3892,281,64,1,3.49,NULL,0.00),(4019,287,73,1,3.79,NULL,0.00);
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
  `CustomerID` bigint DEFAULT NULL,
  `DateCreated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `GuestID` bigint DEFAULT NULL,
  PRIMARY KEY (`RegisterListID`),
  KEY `fk_registerlist_employee` (`EmployeeID`),
  KEY `fk_registerlist_customer` (`CustomerID`),
  CONSTRAINT `fk_registerlist_customer` FOREIGN KEY (`CustomerID`) REFERENCES `Customers` (`CustomerID`) ON DELETE SET NULL,
  CONSTRAINT `fk_registerlist_employee` FOREIGN KEY (`EmployeeID`) REFERENCES `Employees` (`EmployeeID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=288 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RegisterList`
--

LOCK TABLES `RegisterList` WRITE;
/*!40000 ALTER TABLE `RegisterList` DISABLE KEYS */;
INSERT INTO `RegisterList` VALUES (281,3,1000,'2025-11-06 16:09:32',NULL),(287,3,1000,'2025-11-06 18:12:14',NULL);
/*!40000 ALTER TABLE `RegisterList` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `registerlist_before_delete` BEFORE DELETE ON `registerlist` FOR EACH ROW BEGIN
  UPDATE Products p
  JOIN (
    SELECT ProductID, SUM(Quantity) AS TotalQty
    FROM RegisterItems
    WHERE RegisterListID = OLD.RegisterListID
    GROUP BY ProductID
  ) ri ON p.ProductID = ri.ProductID
  SET p.Stock = p.Stock + ri.TotalQty;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RestockOrders`
--

LOCK TABLES `RestockOrders` WRITE;
/*!40000 ALTER TABLE `RestockOrders` DISABLE KEYS */;
INSERT INTO `RestockOrders` VALUES (1,66,1,30,'read','2025-11-04 16:48:23'),(2,64,2,10,'complete','2025-11-04 20:02:09'),(3,64,2,10,'complete','2025-11-05 15:49:29'),(4,64,2,10,'complete','2025-11-05 23:55:33'),(5,66,1,30,'read','2025-11-06 00:08:07'),(6,64,2,10,'complete','2025-11-06 00:08:45'),(7,64,2,10,'complete','2025-11-06 00:09:05'),(8,64,2,10,'complete','2025-11-06 00:09:18'),(9,64,2,10,'complete','2025-11-06 00:09:49'),(10,64,2,10,'complete','2025-11-06 00:11:47'),(11,64,2,10,'complete','2025-11-06 00:12:55'),(12,64,2,10,'complete','2025-11-06 00:14:57'),(13,64,2,10,'complete','2025-11-06 00:20:05'),(14,64,2,10,'complete','2025-11-06 00:23:17'),(15,64,2,10,'complete','2025-11-06 00:27:51'),(16,64,2,10,'complete','2025-11-06 00:27:58'),(17,64,2,10,'complete','2025-11-06 00:33:49'),(18,64,2,10,'complete','2025-11-06 00:33:59'),(19,64,2,10,'complete','2025-11-06 00:34:26'),(20,64,2,10,'complete','2025-11-06 00:40:29'),(21,64,2,10,'complete','2025-11-06 00:40:43'),(22,64,2,10,'complete','2025-11-06 00:41:03'),(23,64,2,10,'complete','2025-11-06 00:45:22'),(24,64,2,10,'complete','2025-11-06 00:48:37'),(25,64,2,10,'complete','2025-11-06 00:55:34'),(26,72,4,15,'read','2025-11-06 00:56:23'),(27,64,2,10,'complete','2025-11-06 00:58:05'),(28,64,2,10,'complete','2025-11-06 00:59:34'),(29,61,1,20,'complete','2025-11-06 13:43:41');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SaleEvents`
--

LOCK TABLES `SaleEvents` WRITE;
/*!40000 ALTER TABLE `SaleEvents` DISABLE KEYS */;
INSERT INTO `SaleEvents` VALUES (1,'Summer Fruits Sale','Discounts on seasonal fruits like bananas, apples, and oranges.','2025-06-01','2025-06-30'),(2,'Organic Veggie Week','Special offers on organic vegetables such as spinach, carrots, and tomatoes.','2025-07-01','2025-07-07'),(3,'Dairy Deals','Promotions on milk, cheese, yogurt, and butter.','2025-08-10','2025-08-20');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Suppliers`
--

LOCK TABLES `Suppliers` WRITE;
/*!40000 ALTER TABLE `Suppliers` DISABLE KEYS */;
INSERT INTO `Suppliers` VALUES (1,'FreshCo Supplies','555-1111','contact@freshco.com','12 Market St'),(2,'FarmJoy Distribution','555-2222','info@farmjoy.com','48 Garden Ave'),(3,'DairyPure Ltd.','555-3333','sales@dairypure.com','5 Creamery Rd'),(4,'BakeHouse Foods','555-4444','orders@bakehouse.com','22 Baker Blvd'),(5,'GoldenGrain Wholesalers','555-5555','hello@goldengrain.com','9 Mill St'),(6,'Oliva Imports','555-6666','support@olivaimports.com','16 Olive Ln'),(7,'SnackWave Co.','555-7777','sales@snackwave.com','3 Crunch Dr');
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

-- Dump completed on 2025-11-06 18:21:29
