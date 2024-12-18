import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from "../../components/nav/nav.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Product } from '../../models/product';
import { ApiService } from '../../services/api.service';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CriterioOrden, SearchDto } from '../../models/searchDto';
import { SelectButtonModule } from 'primeng/selectbutton';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-catalog',
  standalone: true,

  imports: [NavComponent, FooterComponent, InputTextModule,
    FormsModule, PaginatorModule, RouterModule, SelectButtonModule, CommonModule],

  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css',
})
export class CatalogComponent implements OnInit {
  public readonly IMG_URL = environment.apiImg;
  private readonly USER_CONFIG = 'user_config';

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading: boolean = true;

  query: string = '';
  currentPage = 1;
  pageSize = 8;
  totalPages = 0;

  sortOrder: boolean = true; // asc por defecto
  sortCriterio: CriterioOrden = CriterioOrden.Name; // nombre por defecto

  constructor(private apiService: ApiService) { }

  // al cargar la pagina se cargan todos lo productos
  async ngOnInit(): Promise<void> {
    this.loadUserConfig(); // Cargar la configuración de sessionStorage si existe
    await this.loadProducts();
    await this.updateReviews();
  }

  // Cargar configuración desde sessionStorage
  private loadUserConfig(): void {
    const userConfig = sessionStorage.getItem(this.USER_CONFIG);
    if (userConfig) {
      try {
        const config = JSON.parse(userConfig);
        this.updateProducts(config);
      } catch (error) {
        console.error('Error al cargar la configuración de usuario:', error);
        this.throwError("Error al cargar la configuración de usuario.");
      }
    }
  }

  // Guardar configuración actual en sessionStorage
  private saveUserConfig(): void {
    const config = {
      consulta: this.query,
      Criterio: this.sortCriterio,
      Orden: this.sortOrder,
      CantidadPaginas: this.pageSize,
      PaginaActual: this.currentPage,
    };
    sessionStorage.setItem(this.USER_CONFIG, JSON.stringify(config));
  }

  // metodo que carga los productos
  async loadProducts(): Promise<void> {
    this.isLoading = true;
    const searchDto = {
      consulta: this.query,
      Criterio: this.sortCriterio,
      Orden: this.sortOrder, //por defecto asc
      CantidadPaginas: this.pageSize,
      PaginaActual: this.currentPage,
    };

    this.saveUserConfig(); // Guardar la configuración actual en sessionStorage
    await this.resultProducts(searchDto);
    this.isLoading = false;
  }

  // Ejecutar la búsqueda de productos
  async resultProducts(searchDto: SearchDto): Promise<void> {
    try {
      const result = await this.apiService.searchProducts(searchDto);
      this.filteredProducts = result.products;
      this.totalPages = result.totalPages;

    } catch (error) {
      console.error('Error al cargar los productos:', error);
      this.throwError("Error al cargar los productos.");
    }
  }

  // Actualizar las propiedades con la configuración de sessionStorage
  updateProducts(config: {
    consulta: string;
    Criterio: CriterioOrden;
    Orden: boolean;
    CantidadPaginas: number;
    PaginaActual: number;
  }) {
    this.query = config.consulta;
    this.sortCriterio = config.Criterio;
    this.sortOrder = config.Orden;
    this.pageSize = config.CantidadPaginas;
    this.currentPage = config.PaginaActual;

  }

  // al avanzar la pagina
  onPageChange(event: PaginatorState) {
    this.currentPage = event.page + 1;
    this.loadProducts();
  }

  // cuando cambie criterio de orden se vuelve a cargar la pagina
  onSortChange(criterio: CriterioOrden) {
    this.currentPage = 1;
    this.sortCriterio = criterio;
    this.loadProducts();
  }

  // cuando cambie el orden se vuelve a cargar la pagina
  onOrderChange(order: boolean) {
    this.currentPage = 1;
    this.sortOrder = order;
    this.loadProducts();
  }

  // al darle al boton de buscar
  search() {
    this.currentPage = 1;
    this.loadProducts();
   /* console.log('Datos enviados:', {
      query: this.query,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
    });*/
  }

  // nº de productos por pagina
  onPageSizeChange(size: number) {
    this.currentPage = 1;
    this.pageSize = size;
    this.loadProducts();
  }

  // nº de reviews de los productos
  async updateReviews() {
    for (const product of this.filteredProducts) {
      try {
        product.reviews = await this.apiService.loadReviews(product.id);
      } catch (error) {
        product.reviews = [];
      }
    }
  }

  // media de reseñas de cada producto
  calculateAvg(reviews: { label: number }[]): number {
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.label, 0);
      return Math.round(sum / reviews.length);
    }
    return 0;
  }

  // Cuadro de diálogo de error
  throwError(error: string) {
    Swal.fire({ 
      title: "Se ha producido un error",
      text: error,
      icon: "error",
      confirmButtonText: "Vale"
    });
  }

}
