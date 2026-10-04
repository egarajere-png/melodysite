# WhatsApp message templates

WhatsApp only lets a business message a customer first by using a template that Meta has approved.

**The quick way:** put `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_BUSINESS_ACCOUNT_ID` in
`.env.local` and run `npm run setup:whatsapp`. It creates every template below
and shows which are approved. Run it again later to see progress.

**By hand instead:** create each template in **WhatsApp Manager → Message templates → Create template**, with:

- **Category:** Utility
- **Language:** English (the code must match `WHATSAPP_TEMPLATE_LANGUAGE` in the site's settings; `en` by default)
- **Name:** exactly as shown
- **Body:** copy the text exactly, including the `{{1}}` placeholders. No header, footer or buttons.
- **Samples:** when Meta asks for a sample of each placeholder, use the sample values listed.

The wording lives in `lib/notifications/messages.ts`. If it is changed there, the template here must be
edited in WhatsApp Manager to match (and re-approved), or that message will stop sending.

## Customer messages — one per order status

### Order Placed — `order_placed`

```
Hello {{1}}, thank you for your order {{2}} at Aurum Entonet. Your total is {{3}}. Your order will be confirmed as soon as your M-Pesa payment is received. You can view or pay for it at {{4}} at any time.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB · {{3}} = Ksh 4,500 · {{4}} = https://aurumentonet.co.ke/orders/AE-9016FBAB?t=…

Reads as: _Hello Wanjiru, thank you for your order AE-9016FBAB at Aurum Entonet. Your total is Ksh 4,500. Your order will be confirmed as soon as your M-Pesa payment is received. You can view or pay for it at https://aurumentonet.co.ke/orders/AE-9016FBAB?t=… at any time._

### Payment Received — `order_payment_received`

```
Hello {{1}}, we have received your payment of {{2}} for order {{3}}. Thank you! We are now getting your order ready and will keep you updated at every step. Follow it at {{4}} at any time.
```

Samples: {{1}} = Wanjiru · {{2}} = Ksh 4,500 · {{3}} = AE-9016FBAB · {{4}} = https://aurumentonet.co.ke/orders/AE-9016FBAB?t=…

Reads as: _Hello Wanjiru, we have received your payment of Ksh 4,500 for order AE-9016FBAB. Thank you! We are now getting your order ready and will keep you updated at every step. Follow it at https://aurumentonet.co.ke/orders/AE-9016FBAB?t=… at any time._

### Processing — `order_processing`

```
Hello {{1}}, your order {{2}} is now being prepared. Each piece is finished and checked by hand, and we will let you know as soon as it is ready. Follow it at {{3}} at any time.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB · {{3}} = https://aurumentonet.co.ke/orders/AE-9016FBAB?t=…

Reads as: _Hello Wanjiru, your order AE-9016FBAB is now being prepared. Each piece is finished and checked by hand, and we will let you know as soon as it is ready. Follow it at https://aurumentonet.co.ke/orders/AE-9016FBAB?t=… at any time._

### Ready for Collection — `order_ready_for_collection`

```
Hello {{1}}, your order {{2}} is ready for collection at {{3}}. Please have your order number with you when you come. Pickup details are at {{4}} if you need them.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB · {{3}} = Madaraka Primary School, Langata · {{4}} = https://aurumentonet.co.ke/orders/AE-9016FBAB?t=…

Reads as: _Hello Wanjiru, your order AE-9016FBAB is ready for collection at Madaraka Primary School, Langata. Please have your order number with you when you come. Pickup details are at https://aurumentonet.co.ke/orders/AE-9016FBAB?t=… if you need them._

### Dispatched — `order_dispatched`

```
Hello {{1}}, your order {{2}} has been handed to our rider for delivery to {{3}}. We will message you again once it is on its way. Follow it at {{4}} at any time.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB · {{3}} = Madaraka Primary School, Langata · {{4}} = https://aurumentonet.co.ke/orders/AE-9016FBAB?t=…

Reads as: _Hello Wanjiru, your order AE-9016FBAB has been handed to our rider for delivery to Madaraka Primary School, Langata. We will message you again once it is on its way. Follow it at https://aurumentonet.co.ke/orders/AE-9016FBAB?t=… at any time._

### In Transit — `order_in_transit`

```
Hello {{1}}, your order {{2}} is currently in transit to {{3}}. Please keep your phone close, as our rider will call you on arrival. Follow it at {{4}} at any time.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB · {{3}} = Madaraka Primary School, Langata · {{4}} = https://aurumentonet.co.ke/orders/AE-9016FBAB?t=…

Reads as: _Hello Wanjiru, your order AE-9016FBAB is currently in transit to Madaraka Primary School, Langata. Please keep your phone close, as our rider will call you on arrival. Follow it at https://aurumentonet.co.ke/orders/AE-9016FBAB?t=… at any time._

### Delivered — `order_delivered`

```
Hello {{1}}, your order {{2}} has been delivered to {{3}}. We hope you love it. If anything is not right, please reply to this message and we will make it right.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB · {{3}} = Madaraka Primary School, Langata

Reads as: _Hello Wanjiru, your order AE-9016FBAB has been delivered to Madaraka Primary School, Langata. We hope you love it. If anything is not right, please reply to this message and we will make it right._

### Completed — `order_completed`

```
Hello {{1}}, your order {{2}} is now complete. Thank you for shopping with us at Aurum Entonet. It was a pleasure to serve you, and we hope to see you again soon.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB

Reads as: _Hello Wanjiru, your order AE-9016FBAB is now complete. Thank you for shopping with us at Aurum Entonet. It was a pleasure to serve you, and we hope to see you again soon._

### Cancelled — `order_cancelled`

```
Hello {{1}}, your order {{2}} has been cancelled. If you did not ask for this, or you have already paid, please reply to this message and we will help you right away.
```

Samples: {{1}} = Wanjiru · {{2}} = AE-9016FBAB

Reads as: _Hello Wanjiru, your order AE-9016FBAB has been cancelled. If you did not ask for this, or you have already paid, please reply to this message and we will help you right away._

### Refunded — `order_refunded`

```
Hello {{1}}, we have refunded {{2}} for your order {{3}}. The money should reflect in your account shortly. If you have any question, please reply to this message.
```

Samples: {{1}} = Wanjiru · {{2}} = Ksh 4,500 · {{3}} = AE-9016FBAB

Reads as: _Hello Wanjiru, we have refunded Ksh 4,500 for your order AE-9016FBAB. The money should reflect in your account shortly. If you have any question, please reply to this message._

## Admin alert — sent to the shop when an order is paid

### New paid order — `admin_new_paid_order`

```
Hello, a new order has been paid for at Aurum Entonet. Order {{1}} from {{2}}, phone {{3}}. Amount received: {{4}}, M-Pesa receipt {{5}}. Items: {{6}}. {{7}}. Open {{8}} to start processing it.
```

Samples: {{1}} = AE-9016FBAB · {{2}} = Wanjiru Kamau · {{3}} = 0712 345 678 · {{4}} = Ksh 4,500 · {{5}} = SJ12ABCDEF · {{6}} = Maasai Collar (Gold) x1, Beaded Cuff (Red) x2 · {{7}} = Delivery to Madaraka Primary School, Langata · {{8}} = https://aurumentonet.co.ke/admin/orders/AE-9016FBAB

Reads as: _Hello, a new order has been paid for at Aurum Entonet. Order AE-9016FBAB from Wanjiru Kamau, phone 0712 345 678. Amount received: Ksh 4,500, M-Pesa receipt SJ12ABCDEF. Items: Maasai Collar (Gold) x1, Beaded Cuff (Red) x2. Delivery to Madaraka Primary School, Langata. Open https://aurumentonet.co.ke/admin/orders/AE-9016FBAB to start processing it._
