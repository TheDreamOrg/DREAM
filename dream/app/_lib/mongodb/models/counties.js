const mongoose = require("mongoose");

const CountySchema = new mongoose.Schema(
	{
        countyname: {
            type: String,
            required: true,
            unique: true
        },
		zipcodes: {
            type: [String],
            required: false,
            unique: false
        },
        permitted: {
            type: Boolean,
            required: false,
            unique: false
        }
		
    },
	{ collection: "Counties" }   
);

export const Counties =
	mongoose.models.County || mongoose.model("County", CountySchema);