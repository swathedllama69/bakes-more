
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
        <a href="https://instagram.com/bakesandmore" style="color: #B03050; text-decoration: none; margin: 0 5px;">Instagram</a> | 
        <a href="https://facebook.com/bakesandmore" style="color: #B03050; text-decoration: none; margin: 0 5px;">Facebook</a> | 
        <a href="https://wa.me/234800BAKERY" style="color: #B03050; text-decoration: none; margin: 0 5px;">WhatsApp</a>
      </p>
      <p>📞 +234 800 BAKERY | 🌐 <a href="https://bakesandmore.com.ng" style="color: #666;">bakesandmore.com.ng</a></p>
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
      <h1>Order Received! 🎂</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${order.customer_name.split(' ')[0]}</strong>,</p>
      <p>Thank you for choosing Bakes & More! We have received your order request and are reviewing it.</p>
      
      <div class="order-details">
        <div class="detail-row">
          <span class="label">Order Reference:</span>
          <span class="value">#${order.id ? order.id.slice(0, 8) : 'PENDING'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Estimated Total:</span>
          <span class="value">₦${(order.total_price || 0).toLocaleString()}</span>
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

export const OrderConfirmationTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed! ✅</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${order.customer_name.split(' ')[0]}</strong>,</p>
      <p>Great news! Your order has been confirmed and is now being processed.</p>
      
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
          <span class="label">Due Date:</span>
          <span class="value">${new Date(order.due_date || order.delivery_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <p>We will notify you when your order is ready for pickup or delivery.</p>
      
      <div style="text-align: center;">
        <a href="https://bakesandmore.com.ng" class="button">View Our Menu</a>
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
