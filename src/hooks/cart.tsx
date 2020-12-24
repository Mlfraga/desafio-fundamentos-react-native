import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (!storagedProducts) {
        return;
      }

      setProducts(JSON.parse(storagedProducts));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products, setProducts],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      try {
        const productExists = products.find(
          cartProduct => cartProduct.id === product.id,
        );

        if (productExists) {
          increment(product.id);
        } else {
          setProducts([...products, { ...product, quantity: 1 }]);
        }
      } catch (error) {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products, increment, setProducts],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(p => p.id === id);

      if (products[index].quantity <= 0) {
        setProducts(products.splice(index, 1));

        if (products.length) {
          setProducts([]);
        }
      } else {
        setProducts(
          products.map(product =>
            product.id === id
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          ),
        );
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products, setProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
