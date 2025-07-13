function ProductCard({ product }) {
  const { addToCart } = useCart();
  
  return (
    <div className="product-card">
      <Image src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>¥{product.price}</p>
      <button 
        className="add-to-cart-btn"
        onClick={() => addToCart(product)}
      >
        <Image 
          src="/assets/icons/cart.svg"
          alt="购物车"
          width={20}
          height={20}
        />
        加入购物车
      </button>
    </div>
  );
} 