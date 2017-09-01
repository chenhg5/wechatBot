# ************************************************************
# Sequel Pro SQL dump
# Version 4468
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.7.11)
# Database: wechatBot
# Generation Time: 2017-09-01 07:12:18 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table memberlist
# ------------------------------------------------------------

CREATE TABLE `memberlist` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `codeId` varchar(256) DEFAULT NULL,
  `myId` varchar(256) DEFAULT NULL,
  `memberId` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table usercode
# ------------------------------------------------------------

CREATE TABLE `usercode` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(256) DEFAULT NULL,
  `state` varchar(125) DEFAULT NULL,
  `wxuin` varchar(256) DEFAULT NULL,
  `wxsid` varchar(256) DEFAULT NULL,
  `skey` varchar(256) DEFAULT NULL,
  `deviceId` varchar(256) DEFAULT NULL,
  `pass_ticket` varchar(256) DEFAULT NULL,
  `cookie` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
