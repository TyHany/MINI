USE mall;

UPDATE goods 
SET 
  images = '[\"https://img01.yzcdn.cn/vant/ipad.jpeg\", \"https://img01.yzcdn.cn/vant/cat.jpeg\"]',
  content = '<p>这是一个测试商品的详细介绍</p>',
  brief = '商品简介'
WHERE id = 10; 