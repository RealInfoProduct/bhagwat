import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import {  MatTableDataSource } from '@angular/material/table';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { combineLatest } from 'rxjs';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  dateEmployeeForm: FormGroup;
  employeeMasterColumns: string[] = [
    '#',
    'name',
    'salary',
    'day',
    'absent',
    'upad',
    'extra',
    'remain',
    'bonus',
    'finalAMT' 
  ];
  employeeReportList: any[] = [];
  employeeList: any[] = [];
  attendanceList: any[] = [];
  bonusList: any[] = [];
  withdrawalList: any[] = [];
  machineSalaryList: any[] = [];

  employeeListDataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
              private fb: FormBuilder,
              private firebaseService: FirebaseService,
              private loaderService: LoaderService
            ) { }

  ngOnInit(): void {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.dateEmployeeForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });

    this.employeeListDataSource.paginator = this.paginator;
    this.loadAllData();
  }

  loadAllData() {
    this.loaderService.setLoader(true);

    combineLatest([
      this.firebaseService.getAllEmployee(),
      this.firebaseService.getAllAttendance(),
      this.firebaseService.getAllBonus(),
      this.firebaseService.getAllWithdrawal(),
      this.firebaseService.getAllMachineSalary()
    ]).subscribe(([employees, attendance, bonus,withdrawal,machineSalary]: any) => {
      const userId = localStorage.getItem('userId');

      this.employeeList = employees.filter((e: any) => e.userId === userId);
      this.attendanceList = attendance.filter((a: any) => a.userId === userId);
      this.bonusList = bonus.filter((b: any) => b.userId === userId);
      this.withdrawalList = withdrawal.filter((b: any) => b.userId === userId);
      this.machineSalaryList = machineSalary.filter((b: any) => b.userId === userId);
      
      this.filterDate();
      this.loaderService.setLoader(false);
    });
  }

  filterDate() {
    const startDate = new Date(this.dateEmployeeForm.value.start);
    const endDate = new Date(this.dateEmployeeForm.value.end);

    this.employeeReportList = this.employeeList.map(emp => {
      const empAttendance = this.attendanceList.filter(
        a => a.employee === emp.id && this.isDateInRange(a.date, startDate, endDate)
      );

      const empBonus = this.bonusList.filter(
        b => b.employee === emp.id && this.isDateInRange(b.date, startDate, endDate)
      );

      const empwithdrawal = this.withdrawalList.filter(
        b => b.employee === emp.id && this.isDateInRange(b.date, startDate, endDate)
      );

      const empmachineSalary = this.machineSalaryList.filter(
        b => b.employee === emp.id && this.isDateInRange(b.date, startDate, endDate)
      );

      const absentDays = empAttendance.reduce((sum, a) => sum + (a.day || 0), 0);
      const totalBonus = empBonus.reduce((sum, b) => sum + (b.amount || 0), 0);
      const totalwithdrawal = empwithdrawal.reduce((sum, b) => sum + (b.amount || 0), 0);
      const totalmachineSalaryList = empmachineSalary.reduce((sum, b) => sum + (b.amount || 0), 0);

      const daysInMonth = 30;

      const perDaySalary = emp.salary / daysInMonth;
      const absentCut = perDaySalary * absentDays;
      const totalSalary = emp.salary - absentCut;
      const total = totalSalary - totalwithdrawal;
      const totalRemain = total + totalmachineSalaryList;
      const finalAMT = totalRemain + totalBonus;

      return {
        firstName: emp.firstName,
        salary: emp.salary,
        days: daysInMonth,
        abesent: absentDays,
        upad: totalwithdrawal,
        extra: totalmachineSalaryList,
        bonus: totalBonus,
        remain: Math.round(totalRemain),
        finalAMT: Math.round(finalAMT)
      };
    });

    this.employeeListDataSource = new MatTableDataSource(this.employeeReportList);
    this.employeeListDataSource.paginator = this.paginator;
  }

  applyFilter(filterValue: string) {
    this.employeeListDataSource.filter = filterValue.trim().toLowerCase();
  }

  isDateInRange(dateObj: any, start: Date, end: Date): boolean {
    if (!dateObj?.seconds) return false;
    const date = new Date(dateObj.seconds * 1000);
    date.setHours(0,0,0,0);
    return date >= start && date <= end;
  }

  onDateChange() {
    this.filterDate();
  }

  filedownload() {
    const doc: any = new jsPDF();
    const startDate = new Date(this.dateEmployeeForm.value.start);
    const endDate = new Date(this.dateEmployeeForm.value.end);

    const formattedStart = startDate.toLocaleDateString('en-GB');
    const formattedEnd = endDate.toLocaleDateString('en-GB');

    doc.setFontSize(12);
    doc.text(`Salary Report: ${formattedStart} - ${formattedEnd}`, 14, 15);
       const totalAmount = this.employeeReportList.reduce((sum: number, item: any) => sum + parseFloat(item.finalAMT), 0);
    const formattedAmount = Math.round(totalAmount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    doc.text(`Total Amount: - ${formattedAmount}`, 145, 15);
    
    const headers = [
      "Name",
      "Salary",
      "Days",
      "Absent",
      "Upad",
      "Extra",
      "Remain",
      "Bonus",
      "Final AMT",
      "Signature"
    ];

    const data = this.employeeReportList.map(emp => [
      emp.firstName,
      emp.salary,
      emp.days,
      emp.abesent,
      emp.upad,
      emp.extra,
      emp.remain,
      emp.bonus,
      emp.finalAMT,
      ''
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [255, 187, 0], textColor: [0,0,0], fontStyle: 'bold' },
      styles: { fontSize: 9, halign: 'center', valign: 'middle' }
    });

    doc.save(`Salary_Report_${formattedStart.replace(/\//g,'-')}_to_${formattedEnd.replace(/\//g,'-')}.pdf`);
  }
}