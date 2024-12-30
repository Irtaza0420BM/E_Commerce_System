const {Employee} = require('../models/employees');
const jwt = require('jsonwebtoken');
const {doHash, doHashValidation} = require('../utils/hashing')
const {employeeSchema , signinSchema} = require('../middlewares/validator')

exports.register = async (req, res) => {
    console.log(req.body)
     const  {name, username, password, phone, email, address, role="employee"} = req.body;
     let verified = false;
     if(role == 'admin')
     {
        verified = true;
     }
    try{
        const {error}= employeeSchema.validate({name, password, username, phone, email, address}) //I need to insert Uservalidation. 
        if (error)
        {
            return res.status(401).json({success:false, message:error.details[0].message})
        }
        const existingUser = await Employee.findOne({username})
        if(existingUser){
           return res.status(401).json({success:false , message:"the Username already exists,  Create new username. or You are already registered."})
        }
        const hashedpassword = await doHash(password, 12);
        const newEmployee =  new Employee({
            name,
            username,
            password : hashedpassword,
            phone,
            email,
            address,
            verified,
        })
        const result= await newEmployee.save();
        result.password = undefined
        res.status(201).json({
            success:true, message:"your account has been created successfully.",  result
        })
    } 
    catch(error)
    {
        console.log(error)
        return res.status(500).json({success: false, message: "this man"}) // I was having an issue the reason was I chaged my scchema of database. corrected that.
    }

};

//First username that is unique, Validate it. 
exports.signin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const { error } = signinSchema.validate({ username, password });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const existingEmployee = await Employee.findOne({ username });
        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: "User does not exist.",
            });
        }

        const isValidPassword = await doHashValidation(password, existingEmployee.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid password.",
            });
        }

        if (!existingEmployee.verified) {
            return res.status(403).json({
                success: false,
                message: "User is not verified. Please contact the admin.",
            });
        }

        const token = jwt.sign(
            {
                userId: existingEmployee._id,
                username: existingEmployee.username,
                role: existingEmployee.role,
                verified: existingEmployee.verified,
            },
            process.env.TOKEN_SECRET,
            { expiresIn: '8h' }
        );
        
        // Setting cookie with credentials and domain considerations
        res.cookie('Authorization', 'Bearer ' + token, {
            expires: new Date(Date.now() + 8 * 3600000), // 8 hours
            httpOnly: true, 
            secure: false, // Set to true in production (HTTPS)
            sameSite: 'Lax', // 'None' requires 'secure: true'
        });


        return res.status(200).json({
            success: true,
            token,
            role: existingEmployee.role,
            message: "Logged in successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


exports.signout = async (req, res) =>{
    res.clearCookie('Authorization').status(200).json({success:true , message:"logged out successfully"})
}


exports.sendVerificationCode = async (req, res) => 
{
    const{email} = req.body;
    try
    {
        const existingUser = await User.findOne({email})
        if(!existingUser)
            {
                return res
                .status(401)
                .json({success:false , message:"User does not exists"})
            }
        if(existingUser.verified)
        {
            return res
                .status(401)
                .json({success:false , message:"you are verified"})

        }
        const codeValue = Math.floor(Math.random()*1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: process.env.EMAIL,
            subject:"verifcation code",
            html:  '<h1>'+codeValue+'</h1>'

        })   

        console.log(`The verification was sent to user ${existingUser.email}`)

        if(info.accepted[0]=== existingUser.email){
            const hashedValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.verificationCode= hashedValue
            existingUser.verificationCodeValidation = Date.now()
            await existingUser.save()
            return res.status(200).json({success: true, message:'code Sent!'})

        }
        return res.status(400).json({success: false, message:'code couldnt reach!'})

    } 
    catch(error)
    {
        console.log(error)

    }
}


exports.verifyVerificationCode = async (req, res)=> {
    const {email , providedCode} = req.body;
    
    try
     {
        const {error , value} = acceptCodeSchema.validate({email, providedCode})
         if(error) 
        {
            
            return  res
            .status(401)
            .json({ success: false, message: error.details[0].message });
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({email})
        .select('+verificationCode +verificationCodeValidation');
        if(!existingUser)
        {
            console.log('we are herex2' )
            return res
            .status(401)
            .json({success:false , message:"User does not exists"})

        }
        console.log('line 187 we are herex3' )
        if (existingUser.verified)
        {
            return res.status(400).json({success: false, message: "You are already verified!"})
        }
        console.log('we are herex4' )
        console.log(existingUser.verificationCodeValidation)
        console.log(existingUser.verificationCode)
        if (!existingUser.verificationCode ||  !existingUser.verificationCodeValidation)
        {
            return res.status(400).json({success: false, message:"something is wrong with the code."
            })
        }
        console.log('we are herex5' )
        if(Date.now() - existingUser.verificationCodeValidation> 5*60*1000)
        {
            return res
            .status(400)
            .json({ success: false, message:"Code has been failed."})
        }
        console.log('we are herex6' )
        const hashedCodeValue  = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)

        if(hashedCodeValue === existingUser.verificationCode)
        {
            console.log('we are herex7' )
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save()
            return res
            .status(200)
            .json({ success: true, message:"your account has been verified."})
        }
        console.log('we are herex8' )
        return res
        .status(400)
        .json({ success: false, message:" unexpected error occured."})


    }
    catch(error)
    {
        console.log('we are herex9' )
        console.log(error)
    }


}
