import app from './app';
  
const PORT = process.env.PORT || 3000;
  
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};
  
startServer();
