import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  filteredOptions: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ExpensesDialogComponent>, private firebaseService: FirebaseService, private loaderService: LoaderService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.incomegroup()
    this.getExpensesList()
    this.getExpensesmasterList() 
    if (this.action === 'Edit') {
      this.expensesForm.controls['expensesname'].setValue(this.local_data.expensesname)
      this.expensesForm.controls['creditDate'].setValue(this.convertTimestampToDate(this.local_data.creditDate))
      this.expensesForm.controls['description'].setValue(this.local_data.description)
      this.expensesForm.controls['amount'].setValue(this.local_data.amount)
    }
  }

  checkedValue() {
  const selectedValue = this.expensesForm.controls['expensesname'].value?.trim();
  if (selectedValue && !this.options.includes(selectedValue)) {
    this.options.push(selectedValue);
    this.initializeAutocomplete(); // refresh autocomplete with new value
  }
}

   initializeAutocomplete() {
    this.filteredOptions = this.expensesForm.controls['expensesname'].valueChanges.pipe(
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
      expensesname: ['',[Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      creditDate: [new Date()],
      description: ['', Validators.required],
      amount: ['', Validators.required]
    })
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
      expensesname: this.expensesForm.value.expensesname,
      creditDate: this.expensesForm.value.creditDate,
      description: this.expensesForm.value.description,
      amount: this.expensesForm.value.amount
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
      this.initializeAutocomplete();  // <-- important!
      this.loaderService.setLoader(false);
    }
  });
}

}