import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PaymentService, PaymentRequest } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentService],
    });
    service = TestBed.inject(PaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should successfully authorize payment when forceOutcome is true', async () => {
    const request: PaymentRequest = {
      amount: 450,
      method: 'credit_card',
      cardDetails: {
        cardNumber: '4242 4242 4242 4242',
        cardHolder: 'Alex Morgan',
        expiry: '12/28',
        cvv: '123',
      },
    };

    const res = await firstValueFrom(service.pay(request, true));
    expect(res.success).toBe(true);
    expect(res.amount).toBe(450);
    expect(res.transactionId.startsWith('TXN-')).toBe(true);
    expect(res.timestamp).toBeDefined();
  }, 5000);

  it('should reject payment when forceOutcome is false', async () => {
    const request: PaymentRequest = {
      amount: 450,
      method: 'credit_card',
    };

    await expect(firstValueFrom(service.pay(request, false))).rejects.toThrow(
      'Payment authorization failed'
    );
  }, 5000);
});
