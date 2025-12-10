import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentPageProps {
  amount: number;
  shopName: string;
  services: any[];
  bookingType: 'appointment' | 'queue';
  bookingData?: any;
  onPaymentSuccess: (paymentData: any) => void;
  onBack: () => void;
}

const PaymentPage = ({ amount, shopName, services, bookingType, bookingData, onPaymentSuccess, onBack }: PaymentPageProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  // UPI
  const [upiId, setUpiId] = useState('');
  
  // Wallet
  const [walletSelected, setWalletSelected] = useState<'phonepe' | 'paytm' | 'gpay'>('phonepe');

  const handlePayment = async () => {
    // Validate based on payment method
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        toast.error('Please fill all card details');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (cardCvv.length !== 3) {
        toast.error('Please enter a valid 3-digit CVV');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g., name@paytm)');
        return;
      }
    }

    setProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate 95% success rate (for demo purposes)
    const isSuccess = Math.random() > 0.05;

    setProcessing(false);

    if (isSuccess) {
      const paymentData = {
        transactionId: `TXN${Date.now()}`,
        amount: amount,
        method: paymentMethod,
        timestamp: new Date().toISOString(),
        status: 'success'
      };

      toast.success('Payment successful!');
      onPaymentSuccess(paymentData);
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Payment</h1>
          <p className="text-xl text-muted-foreground">{shopName}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {services.map((service, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{service.name}</span>
                    <span className="font-semibold">₹{service.price}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-bold">Total Amount</span>
                <span className="text-2xl font-bold text-primary">₹{amount}</span>
              </div>
              {bookingType === 'appointment' && bookingData && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Booking Type: Appointment</p>
                  <p className="text-sm font-semibold mt-1">
                    {new Date(bookingData.appointment_date).toLocaleDateString()} at{' '}
                    {new Date(bookingData.appointment_date).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </Card>

            {/* Payment Method Selection */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Select Payment Method</h3>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-semibold">Credit/Debit Card</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                      </svg>
                      <span className="font-semibold">UPI</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1 cursor-pointer flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                      </svg>
                      <span className="font-semibold">Digital Wallet</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Card Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry">Expiry Date</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input
                        id="cardCvv"
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                        maxLength={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </div>
              </Card>
            )}

            {/* UPI Payment Form */}
            {paymentMethod === 'upi' && (
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">UPI Payment</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@paytm or yourname@ybl"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This is a demo payment. No actual transaction will be processed.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Wallet Payment Form */}
            {paymentMethod === 'wallet' && (
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Digital Wallet</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={walletSelected === 'phonepe' ? 'default' : 'outline'}
                      onClick={() => setWalletSelected('phonepe')}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <span className="text-2xl mb-1">📱</span>
                      <span className="text-xs">PhonePe</span>
                    </Button>
                    <Button
                      variant={walletSelected === 'paytm' ? 'default' : 'outline'}
                      onClick={() => setWalletSelected('paytm')}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <span className="text-2xl mb-1">💳</span>
                      <span className="text-xs">Paytm</span>
                    </Button>
                    <Button
                      variant={walletSelected === 'gpay' ? 'default' : 'outline'}
                      onClick={() => setWalletSelected('gpay')}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <span className="text-2xl mb-1">💰</span>
                      <span className="text-xs">GPay</span>
                    </Button>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This is a demo payment. No actual transaction will be processed.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay ₹{amount}
                </>
              )}
            </Button>
          </div>

          {/* Security Info Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Secure Payment</h3>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>PCI DSS compliant</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>No card details stored</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                  <span>This is a demo payment system</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

