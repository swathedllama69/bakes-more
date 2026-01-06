
export const getEmailStyles = () => `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { background-color: #B03050; padding: 30px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-family: 'Georgia', serif; font-size: 28px; }
  .content { padding: 30px; }
  .order-details { background-color: #fdfbf7; border: 1px solid #e8ece9; border-radius: 8px; padding: 20px; margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 10px; }
  .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .label { font-weight: bold; color: #666; }
  .value { font-weight: bold; color: #333; }
  .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888; }
  .button { display: inline-block; background-color: #B03050; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
  .highlight { color: #B03050; }
`;

const getFooterContent = () => `
    <div class="footer">
      <div style="margin-bottom: 15px;">
        <img src="https://bakesandmore.com.ng/logo.png" alt="Bakes & More" width="50" height="50" style="display: block; margin: 0 auto;" />
      </div>
      <p><strong>Bakes & More</strong> - Crafted with Love</p>
      <p>
        <a href="https://www.instagram.com/bakesandmore_byhafsaa/" style="color: #B03050; text-decoration: none; margin: 0 5px;">Instagram</a> | 
        <a href="https://wa.me/+2349015670411" style="color: #B03050; text-decoration: none; margin: 0 5px;">WhatsApp</a>
      </p>
      <p>📞 +234 901 567 0411 | 🌐 <a href="https://bakesandmore.com.ng" style="color: #666;">bakesandmore.com.ng</a></p>
      <p style="margin-top: 10px; font-size: 10px; color: #aaa;">&copy; ${new Date().getFullYear()} Bakes & More. All rights reserved.</p>
    </div>
`;

export const NewOrderAdminTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Order Received! 🎉</h1>
    </div>
    <div class="content">
      <p>Hi Hafsat,</p>
      <p>You have received a new order from the website.</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span class="label">Customer:</span>
          <span class="value">${order.customer_name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span class="value">${order.customer_phone}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Amount:</span>
          <span class="value">₦${(order.total_price || 0).toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date Needed:</span>
          <span class="value">${order.due_date || 'Not specified'}</span>
        </div>
         <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
          <span class="label">Details:</span><br/>
          <div style="background: #fff; padding: 10px; border-radius: 6px; font-size: 13px; margin-top: 5px; white-space: pre-wrap;">
            ${order.items_summary || order.customer_notes || 'See Dashboard'}
          </div>
        </div>
      </div>

      <p><strong>Customer Notes:</strong><br/>${order.customer_notes || 'None'}</p>

      <div style="text-align: center;">
        <a href="https://bakesandmore.com.ng/orders/${order.id}" class="button">View Order in Admin</a>
      </div>
    </div>
    ${getFooterContent()}
  </div>
</body>
</html>
`;

export const NewOrderCustomerTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://bakesandmore.com.ng/logo.png" alt="Bakes & More" width="60" style="display: block; margin: 0 auto 10px auto;" />
      <h1>Order Received! 🎂</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${order.customer_name.split(' ')[0]}</strong>,</p>
      <p>Thank you for choosing Bakes & More! We have received your order request.</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span class="label">Order Reference:</span>
          <span class="value">#${order.id ? order.id.slice(0, 8) : 'PENDING'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Estimated Total:</span>
          <span class="value">₦${(order.total_price || 0).toLocaleString()}</span>
        </div>
         <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
          <span class="label">Order Details:</span><br/>
          <div style="background: #fff; padding: 10px; border-radius: 6px; font-size: 13px; margin-top: 5px; white-space: pre-wrap;">
            ${order.items_summary || order.customer_notes || 'Custom Order'}
          </div>
        </div>
      </div>

      <p><strong>What happens next?</strong></p>
      <ol>
        <li>We will review your design and requirements.</li>
        <li>You will receive a confirmation email with payment details.</li>
        <li>Once payment is confirmed, we start baking! 👩‍🍳</li>
      </ol>

      <p>If you have any questions, please reply to this email or call us.</p>
      
      <div style="text-align: center;">
        <a href="https://bakesandmore.com.ng" class="button">Visit Website</a>
      </div>
    </div>
    ${getFooterContent()}
  </div>
</body>
</html>
`;

export const OrderConfirmationTemplate = (order: any, receiptUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
        <img src="https://bakesandmore.com.ng/logo.png" alt="Bakes & More" width="60" style="display: block; margin: 0 auto 10px auto;" />
      <h1>Order Confirmed! ✅</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${order.customer_name.split(' ')[0]}</strong>,</p>
      <p>Great news! Your order has been confirmed.</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span class="label">Order ID:</span>
          <span class="value">#${order.id.slice(0, 8)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Amount:</span>
          <span class="value">₦${(order.total_price || 0).toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="label">Delivery Date:</span>
          <span class="value">${new Date(order.due_date || order.delivery_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

       ${order.account_details ? `
        <div style="background-color: #f0fdf4; border: 1px dashed #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0; color: #15803d; font-weight: bold; font-size: 14px; text-transform: uppercase;">Payment Details</p>
            <p style="font-size: 14px; line-height: 1.6; color: #166534; white-space: pre-wrap;">${order.account_details}</p>
        </div>
      ` : ''}

       <p>To help us process your order faster, kindly upload your payment receipt using the link below:</p>
       <div style="text-align: center; margin: 20px 0;">
          <a href="${receiptUrl || `https://bakesandmore.com.ng/pay/${order.id}`}" style="background-color: #ffffff; border: 2px solid #B03050; color: #B03050; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upload Payment Proof</a>
       </div>
       
      <p>We will notify you as soon as your payment is verified. Thank you for your business!</p>
      
      <div style="text-align: center;">
        <a href="https://bakesandmore.com.ng" class="button">Visit our Website</a>
      </div>
    </div>
    ${getFooterContent()}
  </div>
</body>
</html>
`;

export const PaymentReceivedTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
        <img src="https://bakesandmore.com.ng/logo.png" alt="Bakes & More" width="60" style="display: block; margin: 0 auto 10px auto;" />
      <h1>Payment Verified! 🎉</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${order.customer_name.split(' ')[0]}</strong>,</p>
      <p>Thank you! We have received your payment for order <strong>#${order.id.slice(0, 8)}</strong>.</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span class="label">Amount Paid:</span>
          <span class="value">₦${(order.amount_paid || 0).toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="label">Delivery Date:</span>
          <span class="value">${new Date(order.delivery_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <p>Your order is now fully confirmed and we will deliver as scheduled. We look forward to baking for you!</p>
      
      <p>If you have any changes or questions, kindly reach out to us.</p>
      
      <div style="text-align: center;">
        <a href="https://bakesandmore.com.ng" class="button">Visit Website</a>
      </div>
    </div>
    ${getFooterContent()}
  </div>
</body>
</html>
`;

export const CustomOrderAdminTemplate = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Custom Request! 🎨</h1>
    </div>
    <div class="content">
      <p>Hi Hafsat,</p>
      <p>You have received a new <strong>Custom Order Request</strong>.</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span class="label">Customer:</span>
          <span class="value">${data.name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span class="value">${data.phone}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date Needed:</span>
          <span class="value">${data.date}</span>
        </div>
        <div class="detail-row">
          <span class="label">Budget:</span>
          <span class="value">${data.budget || 'Not specified'}</span>
        </div>
      </div>

      <p><strong>Description:</strong><br/>${data.description}</p>

      <div style="text-align: center;">
        <a href="https://bakesandmore.com.ng/admin/orders" class="button">Go to Admin Panel</a>
      </div>
    </div>
    ${getFooterContent()}
  </div>
</body>
</html>
`;
