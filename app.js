//jshint esversion:6

const express = require("express");
const https = require('https');
const _ = require('lodash');

// function (err,doc) { Traditional Callback Function} vs.
// (err,doc) => {Aroww Function do the same thing but arrow takes up less space and used for simple functions}

const app = express();
const port = 3000;

const mongoose = require('mongoose');

main().catch(err => console.log(err));


async function main() {
const password = process.env.SECRET_KEY;
  await mongoose.connect('mongodb+srv://brobin714:'+ password +'@cluster0.qcwip.mongodb.net/todolistDB');
}

const itemsSchema = {
  name: String
};

const Item = mongoose.model(
  "Item", itemsSchema
);

const item1 = new Item({
  name: 'Welcome to your to-do-list'
});
const item2 = new Item({
  name: 'Hit the + button to add a new item'
});
const item3 = new Item({
  name: 'Hit the checkbox to remove your item'
});

const defaultItems = [item1, item2, item3]

const listsSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model(
  "List", listsSchema
);

app.set('view engine', 'ejs');

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));



app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err, response) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully saved my items to my DB');
        }
      });
      res.redirect('/')
    } else {
      res.render("list", {
        listTitle: 'Today',
        newListItems: foundItems
      });
    }


  });
});

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      // Creates a new list
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save().then(() => {
            res.redirect('/' + customListName);
        });

      } else {
        // show a new list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
    if (err) {
      console.log(err);
    }
  });



})

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  let listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (_.trim(listName) === "Today") {
    item.save().then(() => {
        res.redirect('/')
    });

  } else {
    List.findOne({
      name: listName
    }, (err, foundList) => {
      let foundArray = foundList.items
      foundArray.push(item);
      foundList.save().then(function(){
        res.redirect('/' + listName)
      });
      if (err) {
        console.log(err);
      }
    }
    );
  }

});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove({
      _id: checkedItemId
    }, (err, response) => {
      if (!err) {
        console.log('Successfully deleted checked item');
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }

    }, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});



app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(process.env.PORT || port, () => {
  console.log(`The server launched in http://localhost:${port}`);
});
