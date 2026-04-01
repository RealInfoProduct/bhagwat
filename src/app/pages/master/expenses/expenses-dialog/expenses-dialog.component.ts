import { Component, Inject, OnInit, Optional, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Timestamp } from 'firebase/firestore';
import { map, Observable, startWith } from 'rxjs';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-expenses-dialog',
  templateUrl: './expenses-dialog.component.html',
  styleUrls: ['./expenses-dialog.component.scss']
})
export class ExpensesDialogComponent implements OnInit {

  expensesForm: FormGroup;
  action: string;
  local_data: any;
  expensesmasterList: any = [];
  options: string[] = [];
  filteredOptions: Observable<string[]>[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ExpensesDialogComponent>, private firebaseService: FirebaseService, private loaderService: LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.incomegroup();
    this.getExpensesList();
    this.getExpensesmasterList();
    this.addProduct();
    if (this.action === 'Edit') {
      if (this.getProductsFormArry().length === 0) {
        this.addProduct(); // add first row
      }

      const firstProductGroup = this.getProductsFormArry().at(0);

      firstProductGroup.patchValue({
        expensesname: this.local_data.expensesname,
        description: this.local_data.description,
        amount: this.local_data.amount
      });

      // set creditDate at top-level
      this.expensesForm.controls['creditDate'].setValue(
        this.convertTimestampToDate(this.local_data.creditDate)
      );
    }
  }

  checkedValue(index: number) {

    const productsArray = this.getProductsFormArry();

    const selectedValue = productsArray
      .at(index)
      ?.get('expensesname')
      ?.value
      ?.trim();

    if (selectedValue && !this.options.includes(selectedValue)) {
      this.options.push(selectedValue);
    }
  }

  initializeAutocomplete(index: number) {
    const control = this.getProductsFormArry().at(index).get('expensesname') as FormControl;

    this.filteredOptions[index] = control.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const uniqueOptions = [...new Set(this.options)];
    return uniqueOptions.filter(option =>
      option.toLowerCase().includes(filterValue)
    );
  }

  incomegroup() {
    this.expensesForm = this.fb.group({
      creditDate: [new Date()],
      products: this.fb.array([])
    })
  }


  getProductsFormArry(): FormArray {
    return this.expensesForm.get('products') as FormArray
  }

  addProduct() {
    const index = this.getProductsFormArry().length;
    const group = this.fb.group({
      expensesname: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      description: ['', Validators.required],
      amount: ['', Validators.required]
    })
    this.getProductsFormArry().push(group);
    this.initializeAutocomplete(index);
  }

  removeProduct(index: any) {
    this.getProductsFormArry().removeAt(index)
  }

  convertTimestampToDate(element: any): Date | null {
    if (element instanceof Timestamp) {
      return element.toDate();
    }
    return null;
  }

  doAction() {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      creditDate: this.expensesForm.value.creditDate,
      products: this.expensesForm.value.products,
    }
    this.dialogRef.close({ event: this.action, data: payload })
  }

  closeDialog() {
    this.dialogRef.close({ event: 'cancel' })
  }

  getExpensesmasterList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpensesmaster().subscribe((res: any) => {
      if (res) {
        this.expensesmasterList = res;
        this.loaderService.setLoader(false)
      }
    })
  }

  getExpensesList() {
    this.loaderService.setLoader(true);
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.options = res.map((expense: any) => expense.expensesname);
        this.getProductsFormArry().controls.forEach((_, index) => {
          this.initializeAutocomplete(index);
        });// <-- important!
        this.loaderService.setLoader(false);
      }
    });
  }

}