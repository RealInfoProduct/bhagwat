import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { AttendanceList } from 'src/app/interface/invoice';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { AttendanceDialogComponent } from './attendance-dialog/attendance-dialog.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent {
 dateAttendanceListForm: FormGroup;
  displayedColumns: string[] = [
    'srno',
    'employee',
    'day',
    'date',
    'action',
  ];
  attendanceList :any []= []
  employeeList :any []= []
  attendanceDataSource = new MatTableDataSource(this.attendanceList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog , 
    private firebaseService : FirebaseService ,
    private loaderService : LoaderService,
    private _snackBar: MatSnackBar,  private fb: FormBuilder) { }


  ngOnInit(): void {
       const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateAttendanceListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  this.getAttendanceList()
  this.getEmployeeList() 
  }
  filterDate() {
    if (!this.attendanceList) return;
    const startDate = this.dateAttendanceListForm.value.start ? new Date(this.dateAttendanceListForm.value.start) : null;
    const endDate = this.dateAttendanceListForm.value.end ? new Date(this.dateAttendanceListForm.value.end) : null;
    if (startDate && endDate) {
      this.attendanceDataSource.data = this.attendanceList.filter((invoice: any) => {
        if (!invoice.date?.seconds) return false;

        const invoiceDate = new Date(invoice.date.seconds * 1000);

        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    } else {
      this.attendanceDataSource.data = this.attendanceList;
    }
  }

  applyFilter(filterValue: string): void {
    this.attendanceDataSource.filter = filterValue.trim().toLowerCase();
      if (this.attendanceDataSource.paginator) {
    this.attendanceDataSource.paginator.firstPage();
  }
  }

  
  addAttendance(action: string, obj: any) {
    obj.action = action;

    const dialogRef = this.dialog.open(AttendanceDialogComponent, { data: obj });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: AttendanceList = {
          id: '',
          employee: result.data.employee,
          day: result.data.day,
          date: result.data.date,
          userId : localStorage.getItem("userId")
        }

        this.firebaseService.addAttendance(payload).then((res) => {
          if (res) {
              this.getAttendanceList()
              this.openConfigSnackBar('record create successfully')
            }
        } , (error) => {
          console.log("error=>" , error);
          
        })
      }
      if (result?.event === 'Edit') {
        this.attendanceList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: AttendanceList = {
              id: result.data.id,
              employee: result.data.employee,
              day: result.data.day,
              date: result.data.date,
              userId: localStorage.getItem("userId")
            }
              this.firebaseService.updateAttendance(result.data.id , payload).then((res:any) => {
                  this.getAttendanceList()
                  this.openConfigSnackBar('record update successfully')
              }, (error) => {
                console.log("error => " , error);
                
              })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteAttendance(result.data.id).then((res:any) => {
            this.getAttendanceList()
            this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => " , error);
          
        })
      }
    });
  }


  getAttendanceList() {
  this.loaderService.setLoader(true);

  this.firebaseService.getAllAttendance().subscribe((res: any) => {
    if (res) {
      this.attendanceList = res.filter(
        (item: any) => item.userId === localStorage.getItem("userId")
      );

      this.attendanceList = this.attendanceList.map((item: any) => {
        const emp = this.employeeList.find(e => e.id === item.employee);
        return {
          ...item,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : ''
        };
      });

      this.attendanceDataSource = new MatTableDataSource(this.attendanceList);
      this.attendanceDataSource.paginator = this.paginator;

      this.attendanceDataSource.filterPredicate = (data: any, filter: string) => {
        const searchStr = (data.employeeName + ' ' + data.day + ' ' + (data.date?.seconds ? new Date(data.date.seconds * 1000).toLocaleDateString() : '')).toLowerCase();
        return searchStr.includes(filter);
      };

      this.filterDate();

      this.loaderService.setLoader(false);
    }
  });
}

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  getEmployeeList() {
  this.loaderService.setLoader(true);

  this.firebaseService.getAllEmployee().subscribe((res: any) => {
    if (res) {
      this.employeeList = res.filter(
        (item: any) => item.userId === localStorage.getItem("userId")
      );
      this.loaderService.setLoader(false);

      this.getAttendanceList();
    }
  });
}


getemployeeid(nameid: any) {
    return this.employeeList.find((id: any) => id.id === nameid)?.firstName
  }
getemployeelastid(nameid: any) {
    return this.employeeList.find((id: any) => id.id === nameid)?.lastName
  }

  filedownload() {
  if (!this.attendanceDataSource || this.attendanceDataSource.data.length === 0) {
    this.openConfigSnackBar('No attendance data available to generate PDF.');
    return;
  }

  const doc = new jsPDF();

  // Get date range from form
  const startDate = new Date(this.dateAttendanceListForm.value.start);
  const endDate = new Date(this.dateAttendanceListForm.value.end);

  const formattedStart = startDate.toLocaleDateString('en-GB');
  const formattedEnd = endDate.toLocaleDateString('en-GB');

  // PDF Title
  doc.setFontSize(12);
  doc.text(`Attendance Report: ${formattedStart} - ${formattedEnd}`, 14, 15);

  // Table headers
  const headers = ['S.No', 'Employee Name', 'Day', 'Date'];

  // Table data
  const data = this.attendanceDataSource.data.map((att: any, index: number) => [
    index + 1,
    att.employeeName || '',
    att.day || '',
    att.date?.seconds ? new Date(att.date.seconds * 1000).toLocaleDateString('en-GB') : ''
  ]);

  // Generate table
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [255, 187, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 10, halign: 'center', valign: 'middle' }
  });

  // Save PDF
  doc.save(`Attendance_Report_${formattedStart.replace(/\//g, '-')}_to_${formattedEnd.replace(/\//g, '-')}.pdf`);
}
}

