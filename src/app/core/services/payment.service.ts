import { Injectable } from '@angular/core';
import { Observable, timer, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PaymentMethod } from '../models';

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  cardDetails?: {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  timestamp: string;
  amount: number;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  /**
   * Simulates ~2s network delay with ~90% success rate
   */
  pay(request: PaymentRequest, forceOutcome?: boolean): Observable<PaymentResponse> {
    return timer(2000).pipe(
      switchMap(() => {
        // Allow forced outcome for deterministic unit testing
        const isSuccessful = forceOutcome !== undefined ? forceOutcome : Math.random() < 0.9;

        if (isSuccessful) {
          const response: PaymentResponse = {
            success: true,
            transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            timestamp: new Date().toISOString(),
            amount: request.amount,
          };
          return of(response);
        } else {
          return throwError(() => new Error('Payment authorization failed. The dummy card was declined. Please try again.'));
        }
      })
    );
  }
}
