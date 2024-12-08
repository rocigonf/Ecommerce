import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { FooterComponent } from "../../components/footer/footer.component";
import { NavComponent } from "../../components/nav/nav.component";
import { User } from '../../models/user';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { newProductDto } from '../../models/newProductDto';
import { FormBuilder, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Image } from '../../models/image';
import { ImageRequest } from '../../models/image-request';
import { ImageService } from '../../services/image.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [FooterComponent, NavComponent, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.css'
})
export class AdminProfileComponent implements OnInit {
  user: User | null = null; //datos del usuario
  isEditing = false; //modo edición
  orders: any[] = []; //lista de pedidos
  products: Product[] = []; // Lista de productos
  users: User[] = [] // lista de usuarios

  @ViewChild('addEditDialog')
  addOrEditDialog: ElementRef<HTMLDialogElement>;

  images: Image[] = [];

  imageToEdit: Image = null;
  imageToDelete: Image = null;


  // Datos nuevo producto
  insertProductName: string;
  insertProductPrice: number;
  insertProductStock: number;
  insertProductDescription: string;
  insertProductImage: string;

  newProductForm: FormGroup;
  addOrEditForm: FormGroup;
  editProductForm: FormGroup;
  userForm : FormGroup;
  selectedFile: File;

  passwordForm: FormGroup;

  rutaImgNewProduct: String = "";


  public readonly IMG_URL = environment.apiImg;

  constructor(private authService: AuthService, private router: Router, private apiService: ApiService, private formBuild: FormBuilder, private imageService: ImageService) {
    this.newProductForm = this.formBuild.group({
      productName: ['', Validators.required],
      productPrice: [null, Validators.required],
      productStock: [null, Validators.required],
      productDescription: ['', Validators.required],
      productImage: ['', Validators.required]
    });

    this.addOrEditForm = this.formBuild.group({
      name: ['', Validators.required],
      file: [null, Validators.required]
    });

    this.userForm = this.formBuild.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      password: ['']
    });

    this.passwordForm = this.formBuild.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: this.passwordMatchValidator });
  }

  
  editPassword() {
    if (this.passwordForm.valid) {
      const newPassword = this.passwordForm.get('newPassword')?.value;

      if (!newPassword) {
        console.error("Error: El campo de la contraseña está vacío.");
        return;
      }
      
      this.apiService.modifyPassword(newPassword).subscribe(() => {
        Swal.fire({ // Cuadro de diálogo
          title: "Contraseña modificada con éxito.",
          icon: 'success',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        this.showEditPassword()
      }      
    );
  }
}

  showEditPassword() {
    let element = document.getElementById("newPassword");
    let hidden = element.getAttribute("hidden");

    if (hidden) {
      element.removeAttribute("hidden");
    } else {
      element.setAttribute("hidden", "hidden");
    }
  }

  //obtiene los datos del usuario autenticado
  async ngOnInit() {
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      this.router.navigate(['/']);
    }
    
    this.actualizarUser();
   
    let elementPassword = document.getElementById("newPassword");
    elementPassword.setAttribute("hidden", "hidden");

    this.user = this.authService.getUser();

    this.products = await this.apiService.allProducts();
    this.users = await this.apiService.allUser();

    // que aparezca oculto al principio
    let element = document.getElementById("newProduct");
    element.setAttribute("hidden", "hidden");
  }

  //logica para habilitar la edición solo en el campo necesario
  toggleEdit(field: string) {
    this.isEditing = !this.isEditing;
  }

  toggleInsertProduct(): void { // Muestra u oculta el div de insertar productos
    let element = document.getElementById("newProduct");
    let hidden = element.getAttribute("hidden");

    if (hidden) {
      element.removeAttribute("hidden");
    } else {
      element.setAttribute("hidden", "hidden");
    }
  }

  
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPasswordControl = form.get('confirmPassword');
    const confirmPassword = confirmPasswordControl?.value;

    if (password !== confirmPassword && confirmPasswordControl) {
      confirmPasswordControl.setErrors({ mismatch: true });
    } else if (confirmPasswordControl) {
      confirmPasswordControl.setErrors(null);
    }
  }

  
  // envia cambios para mofidicar el usuario
  onSubmit(): void {
    if (this.userForm.valid) {

      this.apiService.updateUser(this.userForm.value).subscribe(
        () => {
          this.isEditing = false;
        }
      );
      Swal.fire({ // Cuadro de diálogo
        title: "Perfil actualizado correctamente.",
        icon: 'success',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didClose: () => this.actualizarUser()
      });
    }
  }

  
  actualizarUser() {
    this.user = this.authService.getUser();

    // poner los datos en el formulario
    if (this.user) {
      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        address: this.user.address,
      });
    }
  }

  
  //logica para habilitar la edición solo en el campo necesario
  edit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) { // restaura los datos
      this.userForm.reset(this.user);
    }
  } 

  // Crear producto 
  async insertProduct() {


    const formData = new FormData();
    const price = this.newProductForm.get('productPrice').value * 100;
    formData.append('name', this.newProductForm.get('productName').value);
    formData.append('price', price.toString());
    formData.append('stock', this.newProductForm.get('productStock').value.toString());
    formData.append('description', this.newProductForm.get('productDescription').value);
    formData.append('image', this.rutaImgNewProduct.toString());

    try {
      const result = await this.apiService.insertProduct(formData);

      if (result.success) {
        alert('Producto creado con éxito');
        await this.loadProducts();
      }
    } catch (error) {
      console.error('Error al crear el producto: ', error);
    }
  }

  async loadProducts(): Promise<void> {
    this.products = await this.apiService.allProducts();
  }

  resetInsertProductForm(): void {
    this.insertProductName = '';
    this.insertProductPrice = 0;
    this.insertProductStock = 0;
    this.insertProductDescription = '';
    this.insertProductImage = null;
  }

  async deleteUser(id: number) {
    const confirmation = confirm(`¿Estás seguro de que deseas borrar el usuario con id ${id}?`);
    console.log(confirmation)
    if (confirmation) {
      console.log(id);
      const remove = await this.apiService.deleteUser(id); // NO BORRA
      console.log(remove)
    }

  }

  // envia cambios para mofidicar producto
  editProduct(id: number): void {
    if (this.editProductForm.valid) {

      this.apiService.updateProduct(id, this.editProductForm.value).subscribe(
        () => {
          this.isEditing = false;
        }
      );
      alert('Producto actualizado correctamente.');
    }
  }




  openDialog(dialogRef: ElementRef<HTMLDialogElement>) {
    dialogRef.nativeElement.showModal();
  }

  closeDialog(dialogRef: ElementRef<HTMLDialogElement>) {
    dialogRef.nativeElement.close();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.newProductForm.patchValue({ productImage: file });
      this.newProductForm.get('productImage').updateValueAndValidity();
    }
  }

  addImage() {
    this.openDialog(this.addOrEditDialog);
  }

  async createOrUpdateImage() {
    const imageRequest: ImageRequest = {
      name: this.addOrEditForm.get('name')?.value,
      file: this.addOrEditForm.get('file')?.value as File
    };

    if (this.selectedFile) { imageRequest.file = this.selectedFile; }

    // Añadir nueva imagen
    if (this.imageToEdit == null) {
      const request = await this.imageService.addImage(imageRequest);

      if (request.success) {
        this.rutaImgNewProduct = request.data.url;
        alert('Imagen añadida con éxito');

        this.closeDialog(this.addOrEditDialog);
      } else {
        alert(`Ha ocurrido un error: ${request.error}`)
      }
    }
    // Actualizar imagen existente
    else {
      const request = await this.imageService.updateImage(this.imageToEdit.id, imageRequest);

      if (request.success) {
        alert('Imagen actualizada con éxito');
        this.closeDialog(this.addOrEditDialog);
      } else {
        alert(`Ha ocurrido un error: ${request.error}`)
      }
    }
  }


}