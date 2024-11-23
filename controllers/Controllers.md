Employee Creation
The creation of new employees is a significant aspect of human resource management. This process involves several steps,
I made a Schema called Employee, with the following attributes:
- id (primary key), Name, Cnic, Address, Contact, Job, Salary, Department, Date of Joining, Date of Birth, Mar
My function , Register, takes in the required parameters and inserts a new employee into the database.
Now for login
    In login first they will ask for Email and Password
    Then we will check if the email exists in the database or not
    If the email exists then we will check the password
    If the password is correct then we will Check if he is Verified by Admin or not, basically real employee or not.
    Create A token
    Create cookie

// I want to create 3 functions One let the user Create his Collection (user) document, Other let the middle man (admin) create a collection, and the third one to let the user delete his collection
// I will use the Mongoose library to interact with MongoDB
//First Function will be used by Admin only, to create new entries. Will Only Work for admin now.


// What I want my read to do? I want it to check If the user gave any name. if it did , then it will return the collection with the given name. If not, it will return entire collection



// I am creating this function to searchForItem in the dataBase it will be called again and again.
// Things I want front end to do: I want the front end to send the name of the item to the backend only when item name is 2 or more, also I want the front-end to have a speed checker Use debouncing on the frontend to limit the frequency of API calls when typing.
//This is to serach for medicine name it should OnLy send medicine name.

//This one is tested it works. No problem at all. 
