import express from 'express';
import { MongoClient } from 'mongodb';

//connection string
const connStr = "mongodb+srv://atrini02:Jade2003@cluster0.03hjz.mongodb.net/?retryWrites=true&w=majority";

// Create an Express app
const app = express();

// Use JSON parsing 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files 
app.use(express.static('public'));

// Displaying the form 
app.get('/', (req, res) => {
  res.send(`
    <h1>Stock Search</h1>
    <form method="GET" action="/process">
      <label for="searchType">Search by:</label>
      <input type="radio" name="type" value="name" checked> Company Name
      <input type="radio" name="type" value="ticker"> Ticker Symbol<br><br>
      <input type="text" name="query" placeholder="Enter company name or ticker" required><br><br>
      <button type="submit">Search</button>
    </form>
  `);
});

// Processing the form 
app.get('/process', async (req, res) => {

  const { type, query } = req.query;  

  const client = new MongoClient(connStr);

  try {
    await client.connect();
    const db = client.db('Stock');
    const collection = db.collection('PublicCompanies');

    // Build the search query based on the input type
    let filter = {};
    if (type === 'name') {
      filter.companyName = new RegExp(query, 'i'); 
    } else if (type === 'ticker') {
      filter.stockTicker = new RegExp(query, 'i'); 
    }

    // Query the database for matching companies
    const companies = await collection.find(filter).toArray();

    if (companies.length > 0) {
      let results = '<h1>Search Results</h1><ul>';
      companies.forEach(company => {
        // Display company name, stock ticker, and stock price
        results += `<li><strong>${company.companyName}</strong> (${company.stockTicker}) - $${company.stockPrice}</li>`;
      });
      results += '</ul><a href="/">Go Back</a>';
      res.send(results); 
    } else {
      res.send('<p>No results found. Please try again with a different query.</p><a href="/">Go Back</a>');
    }

  } catch (err) {
    console.error('Error querying the database:', err);
    res.send('<p>Error querying the database. Please try again later.</p><a href="/">Go Back</a>');
  } finally {
    await client.close();
  }
});

// Start the Express server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
