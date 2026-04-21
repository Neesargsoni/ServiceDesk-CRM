import mongoose from 'mongoose';

const slaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        required: true
    },
    responseTime: {
        type: Number,
        required: true,
        description: 'Response time in minutes'
    },
    resolutionTime: {
        type: Number,
        required: true,
        description: 'Resolution time in minutes'
    },
    businessHoursOnly: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Default SLA policies
slaSchema.statics.getDefaultPolicies = function () {
    return [
        {
            name: 'Urgent Priority SLA',
            priority: 'Urgent',
            responseTime: 15,      // 15 minutes
            resolutionTime: 240,   // 4 hours
            businessHoursOnly: false,
            isActive: true
        },
        {
            name: 'High Priority SLA',
            priority: 'High',
            responseTime: 60,      // 1 hour
            resolutionTime: 480,   // 8 hours
            businessHoursOnly: false,
            isActive: true
        },
        {
            name: 'Medium Priority SLA',
            priority: 'Medium',
            responseTime: 240,     // 4 hours
            resolutionTime: 1440,  // 24 hours
            businessHoursOnly: true,
            isActive: true
        },
        {
            name: 'Low Priority SLA',
            priority: 'Low',
            responseTime: 480,     // 8 hours
            resolutionTime: 2880,  // 48 hours
            businessHoursOnly: true,
            isActive: true
        }
    ];
};

// Initialize default SLA policies if none exist
slaSchema.statics.initializeDefaults = async function () {
    const count = await this.countDocuments();
    if (count === 0) {
        const defaults = this.getDefaultPolicies();
        await this.insertMany(defaults);
        console.log('✅ Default SLA policies initialized');
    }
};

const SLA = mongoose.model('SLA', slaSchema);

export default SLA;