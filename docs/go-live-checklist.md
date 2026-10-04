# Go-live checklist — payments, email and WhatsApp

Everything here works in testing. This is what is still needed to make it work for real customers,
what to ask the shop owner for, and the steps in order. All keys go in `.env.local` on your computer
and in the hosting provider's environment settings for the live site. Never in `.env.example`.

## What to ask the owner for

| # | What | Why |
|---|---|---|
| 1 | The domain name the shop will use (exact spelling), and who will buy it | The live site, the email links and the M-Pesa callback all need it |
| 2 | The M-Pesa **till number** | Where customers' money lands |
| 3 | The till's **store number** (also called head office number) | Safaricom signs online payments with this, not the till number. It is on the till's registration SMS/letter, or Safaricom can confirm it |
| 4 | The **exact business name** the till is registered under | Go Live rejects a name that doesn't match Safaricom's records |
| 5 | The **M-Pesa business portal username** (a "Business Administrator" or "Business Manager" user on org.ke.m-pesa.com) and access to the phone that receives its codes | Go Live sends a one-time code to that user's phone |
| 6 | The email address Safaricom has on file for the till | The live passkey is emailed there |
| 7 | The Gmail address the shop will send order emails from, and an **app password** for it | Sending order emails |
| 8 | The email address(es) that should receive new-order alerts | `ADMIN_EMAIL` |
| 9 | Admin login to the business's Facebook / Meta Business account (or permission to create one), and business documents for verification | WhatsApp messages |
| 10 | The phone number WhatsApp messages will be sent **from** | See the warning in the WhatsApp section before choosing her current number |
| 11 | The WhatsApp number(s) that should receive new-order alerts | `ADMIN_WHATSAPP_NUMBERS` |
| 12 | The WhatsApp number for the "message us" links on the site | `NEXT_PUBLIC_WHATSAPP_NUMBER` |

## 1. Domain and hosting (do this first)

M-Pesa cannot go live without it: Safaricom must be able to reach the site at a public `https://` address.

1. Register the domain and deploy the site to a host (for a Next.js site, Vercel is the simplest).
2. Copy every setting from `.env.local` into the host's environment variables.
3. Set `NEXT_PUBLIC_SITE_URL` to `https://<domain>` and `MPESA_CALLBACK_URL` to `https://<domain>/api/payments/daraja`.
4. The address `aurumentonet.co.ke` is written into `app/layout.tsx`, `app/sitemap.ts` and `app/robots.ts`; change it if the final domain differs.

## 2. M-Pesa: from sandbox to live

The till number is **not** the shortcode. For a Buy Goods till there are two numbers: the *store number*
(what you enter as the shortcode at Go Live and in `MPESA_SHORTCODE`) and the *till number* (`MPESA_TILL_NUMBER`,
where the money lands).

1. **Portal user.** If the owner has no M-Pesa business portal username, she requests one from Safaricom
   (M-PESA Business support, m-pesabusiness@safaricom.co.ke, or a Safaricom shop) by filling in the business
   administrator form. This can take a few days, so start here.
2. **Go Live.** On developer.safaricom.co.ke, sign in and open **Go Live**. Choose *Shortcode* and enter:
   - Organisation shortcode: the **store number**
   - Organisation name: exactly as registered
   - M-Pesa username: the portal username from step 1
   - Verification type: the one that sends a code to that user's phone
3. Enter the one-time code sent to that phone.
4. Select the product **Lipa na M-Pesa Online (M-Pesa Express)** and submit.
5. **What you get back.** A new *production* app appears under My Apps with its own consumer key and secret.
   Safaricom emails the **live passkey** to the business's email. If it doesn't arrive, ask
   apisupport@safaricom.co.ke to resend it.
6. **Put them in** (hosting settings, and `.env.local` if you want to test live from your computer):

   | Setting | Live value |
   |---|---|
   | `MPESA_ENVIRONMENT` | `production` |
   | `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` | from the production app |
   | `MPESA_SHORTCODE` | the store number |
   | `MPESA_TILL_NUMBER` | the till number |
   | `MPESA_PASSKEY` | the passkey from Safaricom's email |
   | `MPESA_CALLBACK_URL` | `https://<domain>/api/payments/daraja` |
   | `MPESA_CALLBACK_SECRET` | keep the existing one, or generate a new one |
   | `MPESA_SANDBOX_AMOUNT` | empty |

7. **Check.** `npm run check:mpesa -- 07XXXXXXXX` sends a real KES 1 request to your phone and reports the result.
   Then place one small real order on the live site and confirm: the order turns to Payment Received, the M-Pesa
   receipt number shows on the admin order page, and the money reaches the till.

## 3. Email: switch to the shop's real mailbox

How it works: the site signs in to a normal Gmail account and sends from it. No domain or email service is needed.
Gmail allows about 500 emails a day.

1. On the shop's Gmail account, turn on 2-Step Verification, then create an app password at
   myaccount.google.com/apppasswords.
2. Set `SMTP_USER` (the Gmail address), `SMTP_PASS` (the app password), `EMAIL_FROM`
   (`Aurum Entonet <that address>`), `SUPPORT_EMAIL` (where customer replies go) and `ADMIN_EMAIL`
   (who gets new-order alerts; several addresses separated by commas).
3. **Check.** `npm run check:email -- you@example.com` sends a sample customer email to that address and a sample
   new-order alert to `ADMIN_EMAIL`.

## 4. WhatsApp

**Before choosing the sending number:** a number that is already on the WhatsApp or WhatsApp Business phone app
normally has to be removed from the app before it can be used here, and then it can no longer be used for
chatting on the phone. The safe choice is a separate SIM/number for the shop's automatic messages. Meta has been
rolling out a way to use both on one number; check whether it is offered when you add the number.

1. **Business account.** At business.facebook.com create a business portfolio for the shop (or use the existing one).
2. **App.** At developers.facebook.com → My Apps → Create App → type *Business* → add the **WhatsApp** product
   and link it to that business.
3. **Number.** In the app, WhatsApp → API Setup → add the phone number and verify it by SMS or call. Set the
   display name (Meta reviews it).
4. **IDs.** On the same page copy the **Phone number ID** and the **WhatsApp Business Account ID**.
5. **Permanent token.** In Business Settings → Users → System users: add a system user (role Admin), assign it
   the app and the WhatsApp account, then Generate new token with the permissions `whatsapp_business_messaging`
   and `whatsapp_business_management`. The temporary token on the API Setup page expires in a day; don't use it.
6. **Billing and verification.** Add a payment method to the WhatsApp account (Meta charges per order message) and
   complete business verification, which lifts the sending limits.
7. **Put them in:** `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`,
   `WHATSAPP_TEMPLATE_LANGUAGE=en`, `ADMIN_WHATSAPP_NUMBERS`.
8. **Templates.** Run `npm run setup:whatsapp`. It creates the 11 message templates and shows which Meta has
   approved. Run it again until all 11 say APPROVED.
9. **Check.** `npm run setup:whatsapp -- 07XXXXXXXX` sends the "order completed" message to that number.

## 5. Before launch

- Generate a new Supabase service-role key (Supabase → Settings → API), because the old one was published on
  GitHub, and update it everywhere.
- Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the shop's real WhatsApp line.
- Clear the test orders from the database.
- Place one real order end to end and confirm: customer email and WhatsApp at each status, the new-order alert
  on both channels, and "Messages sent" on the admin order page showing everything as sent.
