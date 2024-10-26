import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, FormsModule, NgIf], //ReactiveFormsModule, FormsModule, NgIf
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  
  myForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private http: HttpClient) {
    this.myForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      direction: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: this.passwordMatchValidator });
  }

  // Validator personalizado
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPasswordControl = form.get('confirmPassword');
    const confirmPassword = confirmPasswordControl?.value;
   
    if (password !== confirmPassword && confirmPasswordControl) {
      confirmPasswordControl.setErrors({ mismatch: true });
    } else if (confirmPasswordControl) {
      confirmPasswordControl.setErrors(null); // Asegúrate de limpiar el error si coinciden
    }
  }

  submit() {
    if (this.myForm.valid) {
      const formData = this.myForm.value;
      this.http.post('api', formData).subscribe(
        (response) => {
          console.log('Registro exitoso', response);
        },
        (error) => {
          console.error('Error en el registro', error);
        }
      );
    } else {
      alert('Formulario no válido');
    }
  }
}