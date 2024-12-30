const HTMLToPDF = require('convert-html-to-pdf').default;

exports.receiptpdf = async (creator, invoice, totalbeforeDiscount) => {
  const currentDate = new Date();
  const deliveryDate = currentDate.toISOString().split("T")[0];
  const deliveryTime = currentDate.toTimeString().slice(0, 5);
  const totalamount = totalbeforeDiscount
  const options = {
    discount_price: totalbeforeDiscount-invoice.total,
    total_price: invoice.total,
    created_by: creator,
    name: "Pen & pencil stationers",
    address1: "Khan Colony Stop,Faisalabad road, Okara.",
    address2: "0318-0169282",
    customerName: invoice.customername,
    // logo: "./middlewares/logo/download.jpg", // Path to the logo (if needed)
    orderId: invoice._id,
    delivery_date: deliveryDate,
    delivery_time: deliveryTime,
    items: invoice.items,
    // percentdiscount: invoice.percentdiscount,
    total: totalbeforeDiscount,
    notes: "Thank you for your business!",
    terms:
      "No returns after 5 days.",
    poweredby: "Efaida Technologies"
  };

  return getInvoice(options);
};

//   const options = {
//     name: creator,
//     address1: "Efaida-Benazir Road, Okara.",
//     address2: "Efaida",
//     customerName: invoice.customername,
//     logo: "./middlewares/logo/download.jpg", // Delete this logo
//     orderId: invoice._id,
//     delivery_date: deliveryDate,
//     delivery_time: deliveryTime,
//     items: invoice.items,
//     beforediscount: totalbeforeDiscount, //Soban use this one please.
//     percentdiscount: invoice.percentdiscount, //this is our percent discount
//     total: invoice.total, //Now we have before discount, discount and after discount price.
//     notes: "Thank you for your business!",
//     terms: "No returns after 30 days. /n. Discounted items will not be returned. ",
//   };

//   return getInvoice(options);
// };

function getDeliveryItemsText(items) {
  let data = `
  <div style="margin-top: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">
    <span style="display: inline-block; width: 50%; font-weight: bold;">Item</span>
    <span style="display: inline-block; width: 15%; text-align: center; font-weight: bold;">Qty</span>
    <span style="display: inline-block; width: 15%; text-align: center; font-weight: bold;">Rate</span>
    <span style="display: inline-block; width: 15%; text-align: right; font-weight: bold;">Total</span>
  </div>`;
  for (let item of items) {
    const itemName = item.name || "Unknown Item";
    const itemQty = item.quantity || 0;
    const itemRate =  (item.price / item.quantity || 0);
    const itemAmount =  (item.price || 0);
    data += `
    <div style="padding: 5px 0; border-bottom: 1px dotted #ccc;">
      <span style="display: inline-block; width: 50%;">${itemName}</span>
      <span style="display: inline-block; width: 15%; text-align: center;">${itemQty}</span>
      <span style="display: inline-block; width: 15%; text-align: center;">${itemRate}</span>
      <span style="display: inline-block; width: 15%; text-align: right;">${itemAmount}</span>
    </div>`;
  }
  return data;
}

function getDeliveryHTML(options) {
  const customerName = options.customerName || "N/A";
  const date = options.delivery_date || "N/A";
  const orderId = options.orderId || "N/A";
  const total = options.total || 0;
  const notes = options.notes || "No notes provided.";
  const terms = options.terms || "No terms specified.";

  return `
  <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; max-width: 58mm; margin: auto; padding: 10px; border: 1px solid #000;">
    ${
      options.logo
        ? `<div style="text-align: center; margin-bottom: 10px;">
      <img src="${options.logo}" alt="Logo" style="max-width: 100px; height: auto;">
    </div>`
        : ""
    }
    <div style="text-align: center; margin-bottom: 10px;">
      <h2 style="margin: 0; font-size: 16px; font-weight: bold;">${
        options.name
      }</h2>
      <p style="margin: 0;">${options.address1}</p>
      <p style="margin: 0;">${options.address2}</p>
    </div>
    <hr style="border: none; border-top: 1px solid #000; margin: 10px 0;">
    <div style="margin-bottom: 10px;">
    <p style="margin: 0;"><strong>Created By:</strong> ${options.created_by}</p>
      <p style="margin: 0;"><strong>Customer:</strong> ${customerName}</p>
      <p style="margin: 0;"><strong>Date:</strong> ${date}</p>
      <p style="margin: 0;"><strong>Order #:</strong> ${orderId}</p>
    </div>
    <hr style="border: none; border-top: 1px solid #000; margin: 10px 0;">
    ${getDeliveryItemsText(options.items)}
    <hr style="border: none; border-top: 1px solid #000; margin: 10px 0;">
    <div style="text-align: right; margin-bottom: 10px;">
      <p style="margin: 0;"><strong>Gross Amount:</strong> Rs:${total}</p>
      <p style="margin: 0;"><strong>Discount:</strong> Rs:${
        options.discount_price
      }</p>
      <p style="margin: 0;"><strong>Net Amount:</strong> Rs:${
        options.total_price
      }</p>
    </div>
    <div style="margin-bottom: 10px;">
      <p style="margin: 0;"><strong>Notes:</strong> ${notes}</p>
    </div>
    <div style="margin-bottom: 10px;">
      <p style="margin: 0;"><strong>Terms:</strong> ${terms}</p>
    </div>
    <hr style="border: none; border-top: 1px solid #000; margin: 10px 0;">
    <p style="text-align: center; margin: 0; font-weight: bold;">Thank You!</p>
    <p style="text-align: center;color:gray; padding-top: 10px; margin-bottom:0px; font-family:montserrate; font-size:10px; font-weight: italic;">Powered by: ${options.poweredby}</p>
  </div>`;
}

async function getInvoice(options) {
  return new Promise(async (resolve, reject) => {
    try {
      const html = getDeliveryHTML(options);
      console.log("Generated HTML:", html);

      const htmlToPDF = new HTMLToPDF(html);

      const pdf = await htmlToPDF.convert({
        waitForNetworkIdle: true,
        browserOptions: { defaultViewport: { width: 1920, height: 1080 } },
        pdfOptions: {
          format: "A4", // Adjust as necessary for testing
          printBackground: true,
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
        },
      });

      resolve(pdf);
    } catch (err) {
      reject(err);
    }
  });
}