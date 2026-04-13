import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Timestamp } from 'firebase/firestore';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ExpensesDialogComponent } from './expenses-dialog/expenses-dialog.component';
import { ExpensesList } from 'src/app/interface/invoice';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
import { map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {

  expensesDataColumns: string[] = ['#', 'expenses', 'creditDate', 'description', 'amount', 'action'];
  expensesList: any = [];
  expensesmasterList: any = [];
  dateExpensesListForm: FormGroup;
  expensesForm: FormGroup;
  options: string[] = [];
  filteredOptions!: Observable<string[]>;
  selectedExpensesId: string = '';
  oldExpensesData: any = {};
  

  expensesListDataSource = new MatTableDataSource(this.expensesList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private _snackBar: MatSnackBar,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateExpensesListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
    this.getExpensesList()
    this.incomegroup()
    this.getExpensesmasterList()
  }

   incomegroup() {
    this.expensesForm = this.fb.group({
      creditDate: [new Date()],
       expensesname: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      description: ['', Validators.required],
      amount: ['', Validators.required]
    })
    this.setupFilter() 
  }


  filterDate() {
    if (!this.expensesList) return;

    const startDate = this.dateExpensesListForm.value.start;
    const endDate = this.dateExpensesListForm.value.end;

    if (startDate && endDate) {
      // Convert to timestamps
      const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
      // End time set to 23:59:59.999
      const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

      this.expensesListDataSource.data = this.expensesList.filter((invoice: any) => {
        if (!invoice.creditDate?.seconds) return false;
        const invoiceTime = invoice.creditDate.seconds * 1000; // Firestore timestamp to ms
        return invoiceTime >= startTime && invoiceTime <= endTime;
      });
    } else {
      this.expensesListDataSource.data = this.expensesList;
    }
  }

  ngAfterViewInit() {
    this.expensesListDataSource.paginator = this.paginator;
  }

  applyFilter(filterValue: string): void {
    this.expensesListDataSource.filter = filterValue.trim().toLowerCase();
  }

  convertTimestampToDate(element: any): Date | null {
    if (element instanceof Timestamp) {
      return element.toDate();
    }
    return null;
  }


  // openExpenses(action: string, obj: any) {
  //   const dialogRef = this.dialog.open(ExpensesDialogComponent, {
  //     data: { ...obj, action },
  //   });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result?.event === 'Add') {
  //       const products = result.data.products; // ✅ array
  //       products.forEach((p: any) => {
  //         const payload: ExpensesList = {
  //           id: '',
  //           expensesname: p.expensesname,   // ✅ each product
  //           description: p.description,
  //           amount: p.amount,
  //           creditDate: result.data.creditDate, // ✅ SAME DATE
  //           userId: localStorage.getItem("userId")
  //         };

  //         this.firebaseService.addExpenses(payload).then((res: any) => {
  //           this.getExpensesList();
  //           this.openConfigSnackBar('All records created successfully');
  //         }, (error) => {
  //           console.log("error => ", error);
  //         });

  //       });

  //     }
  //     if (result?.event === 'Edit') {
  //       debugger
  //       const products = result.data.products; // ✅ array

  //       products.forEach((p: any) => {
  //         const payload: ExpensesList = {
  //           id: result.data.id,
  //           expensesname: p.expensesname,
  //           description: p.description,
  //           amount: p.amount,
  //           creditDate: result.data.creditDate,
  //           userId: localStorage.getItem("userId")
  //         }
  //         this.firebaseService.updateExpenses(result.data.id, payload).then((res: any) => {
  //           this.getExpensesList()
  //           this.openConfigSnackBar('record update successfully')
  //         }, (error) => {
  //           console.log("error => ", error);
  //         });
  //       })
  //     }
  //     if (result?.event === 'Delete') {
  //       this.firebaseService.deleteExpenses(result.data.id).then((res: any) => {
  //         this.getExpensesList()
  //         this.openConfigSnackBar('record delete successfully')
  //       }, (error) => {
  //         console.log("error => ", error);

  //       })
  //     }
  //   });
  // }

 ADDExpenses() {
  const formValue = this.expensesForm.value;

  // 👉 compare old vs new (for edit case)
  const isChanged =
    formValue.expensesname === this.oldExpensesData.expensesname ||
    formValue.description === this.oldExpensesData.description ||
    formValue.amount === this.oldExpensesData.amount ||
    new Date(formValue.creditDate).getTime() === new Date(this.oldExpensesData.creditDate?.seconds * 1000).getTime();

  if (this.selectedExpensesId) {

    // 👉 If no change
    if (!isChanged) {
      this.openConfigSnackBar('No changes detected');
      return;
    }

    // 👉 UPDATE
    const payload: ExpensesList = {
      id: this.selectedExpensesId,
      expensesname: formValue.expensesname,
      description: formValue.description,
      amount: formValue.amount,
      creditDate: formValue.creditDate,
      userId: localStorage.getItem("userId")
    };

    this.firebaseService.updateExpenses(this.selectedExpensesId, payload).then(() => {
      this.getExpensesList();
      this.clearFormValidators();   
      this.resetExpensesForm();
      this.setFormValidators(); 
      this.openConfigSnackBar('Record updated successfully');
    });

  } else {

    // 👉 ADD
    const payload: ExpensesList = {
      id: '',
      expensesname: formValue.expensesname,
      description: formValue.description,
      amount: formValue.amount,
      creditDate: formValue.creditDate,
      userId: localStorage.getItem("userId")
    };

    this.firebaseService.addExpenses(payload).then(() => {
      this.getExpensesList();
       this.clearFormValidators(); 
      this.resetExpensesForm();
        this.setFormValidators();     // 👉 re-set

      this.openConfigSnackBar('Record created successfully');
    });
  }
}

  EditExpenses(obj: any) {

  // 👉 store old data
  this.oldExpensesData = { ...obj };

  // 👉 patch form
  this.expensesForm.patchValue({
    expensesname: obj.expensesname,
    description: obj.description,
    amount: obj.amount,
    creditDate: obj.creditDate?.seconds
      ? new Date(obj.creditDate.seconds * 1000)
      : new Date()
  });

  this.selectedExpensesId = obj.id;
}

  DeleteExpenses(obj: any) {
    this.firebaseService.deleteExpenses(obj.id).then((res: any) => {
      this.getExpensesList()
      this.openConfigSnackBar('record delete successfully')
    }, (error) => {
      console.log("error => ", error);

    })
  }

  resetExpensesForm() {
    this.expensesForm.reset();
    this.expensesForm.patchValue({
      creditDate: new Date()
    });
    this.selectedExpensesId = '';
    this.oldExpensesData = {};
     this.setFormValidators();
  }

  getExpensesList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.expensesList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
         this.options = res.map((x: any) => x.expensesname);
        this.options = [...new Set(this.options)];
         this.setupFilter() 
        this.expensesListDataSource = new MatTableDataSource(this.expensesList);
        this.expensesListDataSource.paginator = this.paginator;
        this.filterDate()
        this.loaderService.setLoader(false)
      }
    })
  }

  getExpensesmasterList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpensesmaster().subscribe((res: any) => {
      if (res) {
        this.loaderService.setLoader(false)
      }
    })
  }

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  filedownload() {
  if (!this.expensesListDataSource.data || this.expensesListDataSource.data.length === 0) {
    this.openConfigSnackBar('No expenses data available to generate PDF.');
    return;
  }

  const doc = new jsPDF();

  const startDate = this.dateExpensesListForm.value.start;
  const endDate = this.dateExpensesListForm.value.end;

  const formattedStart = startDate
    ? new Date(startDate).toLocaleDateString('en-GB')
    : '';
  const formattedEnd = endDate
    ? new Date(endDate).toLocaleDateString('en-GB')
    : '';

  // Title
  doc.setFontSize(12);
  doc.text(`Expenses Report: ${formattedStart} - ${formattedEnd}`, 14, 15);

  // Total Amount
  const totalAmount = this.expensesListDataSource.data.reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0
  );

  const formattedAmount = totalAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  doc.text(`Total Amount: ${formattedAmount}`, 140, 15);

  // Table headers
  const headers = [
    '#',
    'Expenses Type',
    'Date',
    'Description',
    'Amount'
  ];

  // Table data
  const data = this.expensesListDataSource.data.map((item: any, index: number) => {
    return [
      index + 1,
      item.expensesname,
      item.creditDate?.seconds
        ? new Date(item.creditDate.seconds * 1000).toLocaleDateString('en-GB')
        : '',
      item.description || '',
      item.amount
    ];
  });

  // Table
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 25,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 187, 0],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      halign: 'center',
      valign: 'middle'
    }
  });

  // Save
  doc.save(
    `Expenses_Report_${formattedStart.replace(/\//g, '-')}_to_${formattedEnd.replace(/\//g, '-')}.pdf`
  );
}

checkedValue(value?: string) {
  const selectedValue = value || this.expensesForm.get('expensesname')?.value?.trim();

  if (selectedValue) {
    const exists = this.options.some(
      opt => opt.toLowerCase() === selectedValue.toLowerCase()
    );

    if (!exists) {
      this.options.push(selectedValue);
    }
  }
}

  // Filter logic
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option =>
      option.toLowerCase().includes(filterValue)
    );
  }

  setupFilter() {
  const control = this.expensesForm.get('expensesname') as FormControl;

  this.filteredOptions = control.valueChanges.pipe(
    startWith(''),
    map(value => this._filter(value || ''))
  );
}
setFormValidators() {
  this.expensesForm.controls['expensesname'].setValidators([Validators.required]);
  this.expensesForm.controls['description'].setValidators([Validators.required]);
  this.expensesForm.controls['amount'].setValidators([Validators.required]);

  this.expensesForm.updateValueAndValidity();
}

clearFormValidators() {
  Object.keys(this.expensesForm.controls).forEach(key => {
    this.expensesForm.get(key)?.clearValidators();
    this.expensesForm.get(key)?.updateValueAndValidity();
  });
}



}



// import { Component, OnInit, ViewChild } from '@angular/core';
// import { MatDialog } from '@angular/material/dialog';
// import { MatPaginator } from '@angular/material/paginator';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { MatTable, MatTableDataSource } from '@angular/material/table';
// import { Timestamp } from 'firebase/firestore';
// import { FirebaseService } from 'src/app/services/firebase.service';
// import { LoaderService } from 'src/app/services/loader.service';
// import { ExpensesDialogComponent } from './expenses-dialog/expenses-dialog.component';
// import { ExpensesList } from 'src/app/interface/invoice';
// import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
// import jsPDF from 'jspdf';
// import { map, Observable, startWith } from 'rxjs';

// @Component({
//   selector: 'app-expenses',
//   templateUrl: './expenses.component.html',
//   styleUrls: ['./expenses.component.scss']
// })
// export class ExpensesComponent implements OnInit {
//   expensesForm!: FormGroup;
//   dateExpensesListForm: FormGroup;
//   expensesDataColumns: string[] = ['#', 'expenses', 'creditDate', 'description', 'amount', 'action'];
//   expensesList: any = [];
//   expensesmasterList: any = [];
//   options: string[] = [];
//   filteredOptions: Observable<string[]>[] = [];

//   expensesListDataSource = new MatTableDataSource(this.expensesList);
//   @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
//   @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

//   constructor(
//     private fb: FormBuilder,
//     private dialog: MatDialog,
//     private firebaseService: FirebaseService,
//     private _snackBar: MatSnackBar,
//     private loaderService: LoaderService
//   ) { }

//   ngOnInit(): void {
//     this.initForm(); // ✅ Initialize form properly
//     this.getExpensesList();
//     this.getExpensesmasterList();

//     const today = new Date();
//     const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
//     const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//     this.dateExpensesListForm = this.fb.group({
//       start: [startDate],
//       end: [endDate]
//     });
//   }

//   // ✅ Proper initialization with one empty product row
//   initForm(): void {
//     this.expensesForm = this.fb.group({
//       creditDate: [new Date(), Validators.required],
//       products: this.fb.array([this.createProductRow()]) // ✅ Start with one row
//     });
    
//     // Initialize autocomplete for first row
//     this.initializeAutocomplete(0);
//   }

//   // ✅ Create a new product row
//   createProductRow(): FormGroup {
//     return this.fb.group({
//       expensesname: ['', [Validators.required]],
//       description: ['', Validators.required],
//       amount: ['', [Validators.required, Validators.min(0)]]
//     });
//   }

//   // ✅ Get products form array - use this in template
//   getProductsFormArry(): FormArray {
//     return this.expensesForm.get('products') as FormArray;
//   }

//   // ✅ Add new product row
//   addProduct(): void {
//     const productsArray = this.getProductsFormArry();
//     const newIndex = productsArray.length;
    
//     productsArray.push(this.createProductRow());
//     this.initializeAutocomplete(newIndex);

//   }

//   // ✅ Remove product row
//   removeProduct(index: number): void {
//     const productsArray = this.getProductsFormArry();
    
//     if (productsArray.length > 1) {
//       productsArray.removeAt(index);
//       this.filteredOptions.splice(index, 1);
     
//     } else {
//       // If only one row, clear it instead of removing
//       productsArray.at(0).reset();
//     }
//   }

//   // ✅ Initialize autocomplete for specific index
//   initializeAutocomplete(index: number): void {
//     const productsArray = this.getProductsFormArry();
    
//     if (productsArray.at(index)) {
//       const control = productsArray.at(index).get('expensesname') as FormControl;
      
//       this.filteredOptions[index] = control.valueChanges.pipe(
//         startWith(''),
//         map(value => this._filter(value || ''))
//       );
//     }
//   }

//   // ✅ Filter options for autocomplete
//   private _filter(value: string): string[] {
//     if (!value) {
//       return this.options;
//     }
//     const filterValue = value.toLowerCase();
//     const uniqueOptions = [...new Set(this.options)];
//     return uniqueOptions.filter(option =>
//       option.toLowerCase().includes(filterValue)
//     );
//   }

//   // ✅ Handle value selection
//   checkedValue(index: number): void {
//     const productsArray = this.getProductsFormArry();
//     const selectedValue = productsArray.at(index)?.get('expensesname')?.value?.trim();

//     if (selectedValue && !this.options.includes(selectedValue)) {
//       this.options.push(selectedValue);
//       // Refresh autocomplete
//       this.initializeAutocomplete(index);
//     }
//   }

//   // ✅ Submit form data
//   onSubmit(): void {
//     if (this.expensesForm.valid) {
      
//       const formData = this.expensesForm.value;
      
//       formData.products.forEach((product: any) => {
//         const payload: ExpensesList = {
//           id: '',
//           expensesname: product.expensesname,
//           description: product.description,
//           amount: product.amount,
//           creditDate: formData.creditDate,
//           userId: localStorage.getItem("userId")
//         };

//         this.firebaseService.addExpenses(payload).then((res: any) => {
//           this.getExpensesList();
//           this.openConfigSnackBar('Record created successfully');
          
//           // Reset form after successful submission
//           this.resetForm();
//         }, (error) => {
//           console.log("error => ", error);
//           this.openConfigSnackBar('Error creating record');
//         });
//       });
//     } else {
//       this.expensesForm.markAllAsTouched();
//       this.openConfigSnackBar('Please fill all required fields');
//     }
//   }

//   // ✅ Reset form
//   resetForm(): void {
//     this.expensesForm.reset();
//     this.filteredOptions = [];
    
//     // Reinitialize with one empty row
//     this.expensesForm = this.fb.group({
//       creditDate: [new Date(), Validators.required],
//       products: this.fb.array([this.createProductRow()])
//     });
    
//     this.initializeAutocomplete(0);
//   }

//   filterDate(): void {
//     if (!this.expensesList) return;

//     const startDate = this.dateExpensesListForm.value.start;
//     const endDate = this.dateExpensesListForm.value.end;

//     if (startDate && endDate) {
//       const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
//       const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

//       this.expensesListDataSource.data = this.expensesList.filter((item: any) => {
//         if (!item.creditDate?.seconds) return false;
//         const invoiceTime = item.creditDate.seconds * 1000;
//         return invoiceTime >= startTime && invoiceTime <= endTime;
//       });
//     } else {
//       this.expensesListDataSource.data = this.expensesList;
//     }
//   }

//   ngAfterViewInit(): void {
//     this.expensesListDataSource.paginator = this.paginator;
//   }

//   applyFilter(filterValue: string): void {
//     this.expensesListDataSource.filter = filterValue.trim().toLowerCase();
//   }

//   convertTimestampToDate(element: any): Date | null {
//     if (element instanceof Timestamp) {
//       return element.toDate();
//     }
//     return null;
//   }

//   openExpenses(action: string, obj: any): void {
//     const dialogRef = this.dialog.open(ExpensesDialogComponent, {
//       data: { ...obj, action },
//     });

//     dialogRef.afterClosed().subscribe((result) => {
//       if (result?.event === 'Add') {
//         const products = result.data.products;
//         products.forEach((p: any) => {
//           const payload: ExpensesList = {
//             id: '',
//             expensesname: p.expensesname,
//             description: p.description,
//             amount: p.amount,
//             creditDate: result.data.creditDate,
//             userId: localStorage.getItem("userId")
//           };

//           this.firebaseService.addExpenses(payload).then((res: any) => {
//             this.getExpensesList();
//             this.openConfigSnackBar('All records created successfully');
//           }, (error) => {
//             console.log("error => ", error);
//           });
//         });
//       }

//       if (result?.event === 'Edit') {
//         const products = result.data.products;
//         products.forEach((p: any) => {
//           const payload: ExpensesList = {
//             id: result.data.id,
//             expensesname: p.expensesname,
//             description: p.description,
//             amount: p.amount,
//             creditDate: result.data.creditDate,
//             userId: localStorage.getItem("userId")
//           };

//           this.firebaseService.updateExpenses(result.data.id, payload).then((res: any) => {
//             this.getExpensesList();
//             this.openConfigSnackBar('Record updated successfully');
//           }, (error) => {
//             console.log("error => ", error);
//           });
//         });
//       }

//       if (result?.event === 'Delete') {
//         this.firebaseService.deleteExpenses(result.data.id).then((res: any) => {
//           this.getExpensesList();
//           this.openConfigSnackBar('Record deleted successfully');
//         }, (error) => {
//           console.log("error => ", error);
//         });
//       }
//     });
//   }

//   // getExpensesList(): void {
//   //   this.loaderService.setLoader(true);
//   //   this.firebaseService.getAllExpenses().subscribe((res: any) => {
//   //     if (res) {
//   //       this.expensesList = res.filter((item: any) => item.userId === localStorage.getItem("userId"));
//   //       this.expensesListDataSource = new MatTableDataSource(this.expensesList);
//   //       this.expensesListDataSource.paginator = this.paginator;
//   //       this.filterDate();
//   //       this.loaderService.setLoader(false);
//   //     }
//   //   });
//   // }

//   getExpensesmasterList(): void {
//     this.loaderService.setLoader(true);
//     this.firebaseService.getAllExpensesmaster().subscribe((res: any) => {
//       if (res) {
//         this.loaderService.setLoader(false);
//       }
//     });
//   }

// getExpensesList(): void {
//   this.loaderService.setLoader(true);
//   this.firebaseService.getAllExpenses().subscribe((res: any[]) => {
//     if (res && res.length > 0) {
//       // Filter expenses by userId
//       const userWiseExpenses = res.filter(
//         (expense: any) => expense.userId === localStorage.getItem("userId")
//       );

//       // Set expenses list
//       this.expensesList = userWiseExpenses;
//       this.expensesListDataSource = new MatTableDataSource(this.expensesList);
//       this.expensesListDataSource.paginator = this.paginator;

//       // Populate options for autocomplete
//       this.options = userWiseExpenses.map(
//         (expense: any) => expense.expensesname
//       );

//       // Remove duplicates from options
//       this.options = [...new Set(this.options)];

//       // Initialize autocomplete for all product rows
//       if (this.expensesForm && this.getProductsFormArry()) {
//         this.getProductsFormArry().controls.forEach((_, index) => {
//           this.initializeAutocomplete(index);
//         });
//       }

//       // Apply date filter
//       this.filterDate();
//       this.loaderService.setLoader(false);
//     } else {
//       this.expensesList = [];
//      this.expensesListDataSource = new MatTableDataSource(this.expensesList);
//       this.options = [];
//       this.loaderService.setLoader(false);
//     }
//   });
// }

//   openConfigSnackBar(snackbarTitle: any): void {
//     this._snackBar.open(snackbarTitle, 'Close', {
//       duration: 2 * 1000,
//       horizontalPosition: 'right',
//       verticalPosition: 'top',
//     });
//   }

//   filedownload(): void {
//     if (!this.expensesListDataSource.data || this.expensesListDataSource.data.length === 0) {
//       this.openConfigSnackBar('No expenses data available to generate PDF.');
//       return;
//     }

//     const doc = new jsPDF();
//     const startDate = this.dateExpensesListForm.value.start;
//     const endDate = this.dateExpensesListForm.value.end;

//     const formattedStart = startDate ? new Date(startDate).toLocaleDateString('en-GB') : '';
//     const formattedEnd = endDate ? new Date(endDate).toLocaleDateString('en-GB') : '';

//     doc.setFontSize(12);
//     doc.text(`Expenses Report: ${formattedStart} - ${formattedEnd}`, 14, 15);

//     const totalAmount = this.expensesListDataSource.data.reduce(
//       (sum: number, item: any) => sum + Number(item.amount || 0),
//       0
//     );

//     const formattedAmount = totalAmount.toLocaleString('en-IN', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });

//     doc.text(`Total Amount: ${formattedAmount}`, 140, 15);

//     const headers = ['#', 'Expenses Type', 'Date', 'Description', 'Amount'];

//     const data = this.expensesListDataSource.data.map((item: any, index: number) => {
//       return [
//         index + 1,
//         item.expensesname,
//         item.creditDate?.seconds
//           ? new Date(item.creditDate.seconds * 1000).toLocaleDateString('en-GB')
//           : '',
//         item.description || '',
//         item.amount
//       ];
//     });

//     (doc as any).autoTable({
//       head: [headers],
//       body: data,
//       startY: 25,
//       theme: 'grid',
//       headStyles: {
//         fillColor: [255, 187, 0],
//         textColor: [0, 0, 0],
//         fontStyle: 'bold'
//       },
//       styles: {
//         fontSize: 9,
//         halign: 'center',
//         valign: 'middle'
//       }
//     });

//     doc.save(
//       `Expenses_Report_${formattedStart.replace(/\//g, '-')}_to_${formattedEnd.replace(/\//g, '-')}.pdf`
//     );
//   }
// }