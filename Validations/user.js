import Joi from "joi"

const joiUserSchema=Joi.object({
    name:Joi.string().required().min(3),
    email:Joi.string().email().required(),
    password:Joi.string().min(6).required(),
    address:Joi.string().min(5).required()
})

export default joiUserSchema