This is file for logs of errors I had, To make sure I can track them and solve them easily. I will keep this file updated with all the errors I encounter


So First Error I had was with database. I Was unable to connect it, Basically my document name was const collection = mongoose.model('Item', itemSchema); and I was trying to connect it throught Item. Which was being the issue. 
So I had 2nd issue with my read Function, To check for null or undefined, first do name = name ?? then condition for null
REMEMBER .find() sends an empty array if no data is found. So we need to check if the array is empty or not so we say if its array and its legnth is 0.
