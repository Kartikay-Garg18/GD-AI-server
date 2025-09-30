import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/userSchema.js';

// signup 
export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    // console.log(req.body);
    
    try {
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: 'This email is already associated with an account' });
        }

        const hashedPw = await bcrypt.hash(password, 12);
        const newUser = new User({ name, email, password: hashedPw });
        await newUser.save();

        return res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Signup error' });
    }
};

// login 
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: 'user' },process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRY });

        return res.status(200).json({user: {id: user._id, name: user.name, email: user.email}, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Login error' });
    }
};


