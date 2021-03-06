import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => { 
    try {
      const productExist = cart.find(product => product.id === productId);
      const stock: Stock = await api.get(`stock?id=${productId}`)
      .then(response => response.data[0]);
      
      if(productExist) {
        
        if(productExist.amount < stock.amount) {
          const newProductAmount = cart.map(product => product.id == productId ? {
            ...product, // Copia o valor do product
            amount: product.amount + 1 // Altera o valor do atributo
          } : product);
          
          setCart(newProductAmount)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProductAmount))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
        
      } else {
        const product: Product = await api.get(`products?id=${productId}`)
        .then(response => response.data[0])

        const productCart = [...cart, {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          amount: 1
        }]

        setCart(productCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productCart))
      }  

      } catch (error) {
        toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeProductCart = cart.filter(products => products.id != productId)
      
      setCart(removeProductCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProductCart))
    } catch {
      // TODO
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const productStock: Stock = await api.get(`stock?id=${productId}`)
        .then(response => response.data[0])            
 
      if(amount <= productStock.amount) {
        const newProductAmount = cart.map(product => product.id === productId ? {
          ...product, 
          amount
        }: product)

        setCart(newProductAmount)  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProductAmount))
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
      
    } catch {
      // TODO
      toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
