if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

// console.log(stripeSecretKey, stripePublicKey);

const express = require("express");
const stripe = require("stripe")(stripeSecretKey);

const app = express();
const fs = require("fs");

//using middleware
app.use(express.static("public"));
app.use(express.json());

//Setting the view engine
app.set("view engine", "ejs");

//Setting up routes
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/store", (req, res) => {
  fs.readFile("items.json", (err, data) => {
    if (err) {
      res.status(500).end();
    } else {
      res.render("store", {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data),
      });
    }
  });
});

app.post("/purchase", (req, res) => {
  fs.readFile("items.json", (err, data) => {
    if (err) {
      res.status(500).end();
    } else {
      const itemsJson = JSON.parse(data);
      const itemsArray = itemsJson.music.concat(itemsJson.merch);
      let total = 0;
      req.body.items.forEach((item) => {
        const itemJson = itemsArray.find((i) => {
          return i.id == item.id;
        });
        total = total + itemJson.price * item.quantity;
      });
      stripe.charges
        .create({
          amount: total,
          source: req.body.stripeTokenId,
          currency: "usd",
        })
        .then(() => {
          console.log("Charge successful");
          res.json({ message: "Successfully purchased item" });
        })
        .catch(() => {
          console.log("Charge failed");
          res.status(500).end();
        });
    }
  });
});

app.listen(3000);
