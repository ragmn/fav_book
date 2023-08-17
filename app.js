const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const port = 3000; // Change this to the desired port
app.use(express.json()); 

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

// Connect to MongoDB
mongoose.connect('mongodb+srv://ragavendramurthy:tqN3HUWEcxMO64ep@cluster0.rcykzk6.mongodb.net/random_books_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
// Define Book schema
const bookSchema = new mongoose.Schema({
    id: String,
    title: String,
    authors: [String],
    description: String,
    imageLink: String,
    votes: { type: Number, default: 0 },
  });

  const Book = mongoose.model('Book', bookSchema);


db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// Function to fetch random books
async function fetchRandomBooks() {
  try {
    const response = await axios.get(GOOGLE_BOOKS_API_URL, {
      params: {
        q: 'a', // Search term 'a' retrieves random results
        maxResults: 3, // Number of books to fetch
      },
    });

    const books = response.data.items;
    return books.map(book => ({
        id: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors,
      description: book.volumeInfo.description,
      imageLink: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : null,
    }));
  } catch (error) {
    console.error('Error fetching books:', error.message);
    return [];
  }
}

// API endpoint to fetch random books
app.get('/api/random-books', async (req, res) => {
  const randomBooks = await fetchRandomBooks();
  res.json(randomBooks);
});

// API endpoint to save or update a book
app.post('/api/books', async (req, res) => {
    console.log(req.body)
    const {id, title, authors, description="Sample Description", imageLink } = req.body;
    
    if (!id || !title || !authors || !description) {
      return res.status(400).json({ error: 'Title, authors, and description are required fields.' });
    }
  
    try {
      const existingBook = await Book.findOne({ id });
      if (existingBook) {
        existingBook.authors = authors;
        existingBook.description = description;
        existingBook.imageLink = imageLink;
        existingBook.votes = 
        await existingBook.save();
        return res.json(existingBook);
      } else {
        const newBook = new Book({ id,title, authors, description, imageLink });
        await newBook.save();
        return res.json(newBook);
      }
    } catch (error) {
      console.error('Error saving book:', error.message);
      return res.status(500).json({ error: 'An error occurred while saving the book.' });
    }
  });

// API endpoint to increase votes for a book
app.put('/api/books/:id/vote', async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
      const existingBook = await Book.findOne({id:id});
  
      if (!existingBook) {
        return res.status(404).json({ error: 'Book not found.' });
      }
  
      existingBook.votes = (existingBook.votes || 0) + 1;
      await existingBook.save();
  
      return res.json(existingBook);
    } catch (error) {
      console.error('Error updating book votes:', error.message);
      return res.status(500).json({ error: 'An error occurred while updating book votes.' });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
