import { Injectable } from '@angular/core';
import { Cart } from '../models/cart';
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductCart } from '../models/productCart';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly CART_KEY = 'cartProducts';
  private readonly BASE_URL = environment.apiUrl;
  localCart: ProductCart[] = [];

  // Para controlar en el login si se viene desde el inicio de sesión o desde el pago
  public actionSource: string | null = null;

  // Observable para actualizar el carrito en tiempo real
  private cartProductCountSubject = new BehaviorSubject<number>(0);
  cartProductCount$ = this.cartProductCountSubject.asObservable();

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private api: ApiService
  ) {
    this.initializeCartProductCount();
  }

  // NOtificacion nº de productos del carrito en nav
  private async initializeCartProductCount() {
    const count = await this.updateCartProductCount();
    this.cartProductCountSubject.next(count);
  }

  // productos del carrito desde localStorage
  getCartFromLocal(): ProductCart[] {
    const cart = localStorage.getItem(this.CART_KEY);
    const cartParsed = cart ? JSON.parse(cart) : [];
    return cartParsed;
  }

  // obtener carrito de bbdd segun el usuario
  async getCartByUser(id: number): Promise<Cart> {
    const request: Observable<Object> = this.http.get(
      `${this.BASE_URL}Cart/byUser/${id}`
    );

    const dataRaw: any = await lastValueFrom(request);

    const cart: Cart = {
      id: dataRaw.id,
      userId: dataRaw.userId,
      products: dataRaw.products,
      user: dataRaw.user,
    };
    return cart;
  }

  // Guardar productos del carrito en localStorage
  private saveCart(cartProducts: ProductCart[]): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(cartProducts));
  }

  // Actualizar la cantidad de un producto específico en el carrito en localStorage
  updateCartProductLocal(product: ProductCart): void {
    const cart = this.getCartFromLocal();
    const index = cart.findIndex((p) => p.productId === product.productId);

    if (index !== -1) {
      // Si el índice es -1, es que no existe
      cart[index] = product;
      this.saveCart(cart);
    }
  }

  updateCartProductBBDD(
    userId: number,
    productId: number,
    newQuantity: number
  ): Observable<any> {
    const url = `${this.BASE_URL}ProductCart/updateQuantity/${userId}/${productId}?newQuantity=${newQuantity}`;
    return this.http.put(url, null, { responseType: 'text' });
  }

  async addToCartBBDD(
    quantity: number,
    cartId: number,
    productId: number
  ): Promise<any> {
    //console.log('Carritos sincronizados');
    const url = `ProductCart/addProduct`;
    const body = {
      quantity: quantity,
      cartId: cartId,
      productId: productId,
    };
    return await this.api.post(url, body);
  }

  // Eliminar un producto del carrito
  removeFromCartLocal(id: number): void {
    if (id === null || id === undefined) {
      console.log('Id inválida: ', id); // Odio Angular
    } else {
      const cart = this.getCartFromLocal();
      const index = cart.findIndex((p) => p.productId == id);
      //console.log('Índice: ' + index);

      if (index !== -1) {
        cart.splice(index, 1);
        this.saveCart(cart);
      }
    }
  }

  removeFromCartBBDD(idCart: number, idProduct: number): Observable<any> {
    const url = `${this.BASE_URL}ProductCart/removeProduct/${idCart}/${idProduct}`;
    return this.http.delete(url, { responseType: 'text' });
  }

  // Limpiar el carrito completo
  clearCart(): void {
    localStorage.removeItem(this.CART_KEY);
  }

  async addLocalCartToUser(userId: number, localCart: ProductCart[]) {
    const userCart = await this.getCartByUser(userId);

    for (let product of localCart) {
      await this.addToCartBBDD(
        product.quantity,
        userCart.id,
        product.productId
      );
    }
  }

  // CREAR ORDEN TEMPORAL:

  // si el usuario está logueado, desde la BBDD le enviamos el carrito
  newTemporalOrderBBDD(cart: Cart, paymentMethod: string): Observable<any> {
    const url = `${this.BASE_URL}TemporalOrder/newTemporalOrderBBDD?paymentMethod=${paymentMethod}`;
    return this.http.post(url, cart);
  }

  // si el usuario no está logueado, desde el local Storage le enviamos el carrito
  newTemporalOrderLocal(
    cart: ProductCart[],
    paymentMethod: string
  ): Observable<any> {
    const url = `${this.BASE_URL}TemporalOrder/newTemporalOrderLocal?paymentMethod=${paymentMethod}`;
    return this.http.post(url, cart);
  }

  // actualizar el número de productos del carrito
  async updateCartProductCount(): Promise<number> {

    let cartProductCount = 0; // número de productos

    if (this.authService.isAuthenticated()) {
      // si el usuario está logueado, se obtiene el carrito de la base de datos
      try {
        const user = this.authService.getUser();
        const userId = user ? user.userId : null;
        const cart = await this.getCartByUser(userId);
        if (cart.products) {
          cart.products.forEach(product => (cartProductCount += product.quantity));
        }
      } catch (error) {
        console.error("Error al obtener el carrito:", error);
      }

    } else {
      // si no lo está, se obtiene del localStorage
      const cart = this.getCartFromLocal();
      cart.forEach(product => (cartProductCount += product.quantity));
    }

    this.cartProductCountSubject.next(cartProductCount);
    return cartProductCount;
  }

  // Notificar de un cambio en la cantidad de productos del carrito
  notifyCartChange() {
    this.updateCartProductCount();
  }

}