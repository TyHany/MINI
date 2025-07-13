-- Active: 1737213233302@@127.0.0.1@3306@mall
-- 创建数据库
CREATE DATABASE IF NOT EXISTS mall DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE mall;

-- 管理员用户表
CREATE TABLE `admin_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(32) NOT NULL COMMENT '密码',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态 0:禁用 1:启用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员用户表';

-- 插入管理员账号 (密码admin的MD5值为21232f297a57a5a743894a0e4a801fc3)
INSERT INTO admin_user (username, password) VALUES ('admin', '21232f297a57a5a743894a0e4a801fc3');

-- 小程序用户表
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid',
    nickname VARCHAR(50) COMMENT '用户昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '小程序用户表';

-- 商品分类表
CREATE TABLE category (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    image_url VARCHAR(255) COMMENT '分类图片',
    sort INT DEFAULT 0 COMMENT '排序(数字越大越靠前)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '商品分类表';

-- 商品表
CREATE TABLE goods (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品ID',
    category_id INT NOT NULL COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    price DECIMAL(10,2) NOT NULL COMMENT '商品价格',
    stock INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    image_url VARCHAR(255) COMMENT '商品主图',
    detail TEXT COMMENT '商品详情',
    status TINYINT DEFAULT 1 COMMENT '状态(0下架,1上架)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (category_id) REFERENCES category(id)
) COMMENT '商品表';

ALTER TABLE goods 
ADD COLUMN is_recommend TINYINT DEFAULT 0 COMMENT '是否推荐(0不推荐,1推荐)' 
AFTER status;

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) NOT NULL COMMENT '订单号',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `total_amount` decimal(10,2) NOT NULL COMMENT '订单总金额',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '订单状态：0待支付，1已支付，2已发货，3已完成',
  `receiver_name` varchar(50) NOT NULL COMMENT '收货人姓名',
  `receiver_phone` varchar(20) NOT NULL COMMENT '收货人电话',
  `receiver_address` text NOT NULL COMMENT '收货地址',
  `pay_time` datetime DEFAULT NULL COMMENT '支付时间',
  `transaction_id` varchar(100) DEFAULT NULL COMMENT '支付交易号',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 订单商品表
CREATE TABLE IF NOT EXISTS `order_goods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `goods_id` int(11) NOT NULL COMMENT '商品ID',
  `goods_name` varchar(100) NOT NULL COMMENT '商品名称',
  `goods_image` varchar(255) NOT NULL COMMENT '商品图片',
  `goods_price` decimal(10,2) NOT NULL COMMENT '购买时价格',
  `quantity` int(11) NOT NULL COMMENT '购买数量',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_goods_id` (`goods_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品表';

-- 收货地址表
CREATE TABLE IF NOT EXISTS `address` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `receiver_name` varchar(50) NOT NULL COMMENT '收货人姓名',
  `receiver_phone` varchar(20) NOT NULL COMMENT '收货人电话',
  `province` varchar(50) NOT NULL COMMENT '省份',
  `city` varchar(50) NOT NULL COMMENT '城市',
  `district` varchar(50) NOT NULL COMMENT '区县',
  `detail_address` text NOT NULL COMMENT '详细地址',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否默认地址：0否，1是',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表'; 

-- 购物车表
CREATE TABLE cart (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '购物车ID',
    user_id INT NOT NULL COMMENT '用户ID',
    goods_id INT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '商品数量',
    selected TINYINT DEFAULT 1 COMMENT '是否选中(0未选中,1选中)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (goods_id) REFERENCES goods(id)
) COMMENT '购物车表';

-- 轮播图表
CREATE TABLE banner (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '轮播图ID',
    image_url VARCHAR(255) NOT NULL COMMENT '图片URL',
    link_url VARCHAR(255) COMMENT '跳转链接',
    sort INT DEFAULT 0 COMMENT '排序(数字越大越靠前)',
    status TINYINT DEFAULT 1 COMMENT '状态(0禁用,1启用)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '轮播图表'; 

CREATE TABLE `page_view` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `page` varchar(100) NOT NULL COMMENT '页面路径',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面访问记录表';



-- orders表索引
ALTER TABLE orders
ADD INDEX idx_create_time (create_time),
ADD INDEX idx_status (status),
ADD INDEX idx_user_id (user_id),
ADD INDEX idx_create_status (create_time, status);

-- order_goods表索引
ALTER TABLE order_goods
ADD INDEX idx_order_id (order_id),
ADD INDEX idx_goods_id (goods_id),
ADD INDEX idx_price_quantity (goods_price, quantity);

-- goods表索引
ALTER TABLE goods
ADD INDEX idx_status (status),
ADD INDEX idx_category_status (category_id, status);