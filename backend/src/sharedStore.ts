import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export interface MockUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
}

export interface MockMessage {
    id: string;
    listingId: string;
    customerId: string;
    senderId: string;
    senderRole: 'CUSTOMER' | 'MIDDLEMAN';
    messageText: string;
    createdAt: Date;
}

export interface MockListing {
    id: string;
    title: string;
    description: string | null;
    address: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string;
    status: string;
    pricePerNight: number;
    ownerId: string;
    imageUrls: string[];
    createdAt: Date;
    distance?: number;
}

class SharedMockStore {
    public mockUsers: MockUser[] = [
        { id: 'admin-1', name: 'Ops Admin',     email: 'admin@rentalops.com', password: bcrypt.hashSync('admin123', SALT_ROUNDS), role: 'ADMIN',      createdAt: new Date() },
        { id: 'mid-1',   name: 'Rahul Sharma',  email: 'rahul@rentalops.com', password: bcrypt.hashSync('rahul123', SALT_ROUNDS), role: 'MIDDLEMAN',  createdAt: new Date() },
        { id: 'mid-2',   name: 'Priya Patel',   email: 'priya@rentalops.com', password: bcrypt.hashSync('priya123', SALT_ROUNDS), role: 'MIDDLEMAN',  createdAt: new Date() },
        { id: 'cust-1',  name: 'Alex Johnson',  email: 'alex@gmail.com',      password: bcrypt.hashSync('alex123',  SALT_ROUNDS), role: 'CUSTOMER',   createdAt: new Date() },
        { id: 'cust-2',  name: 'Sara Williams', email: 'sara@gmail.com',      password: bcrypt.hashSync('sara123',  SALT_ROUNDS), role: 'CUSTOMER',   createdAt: new Date() },
    ];

    public mockMessages: MockMessage[] = [];

    public mockListings: MockListing[] = [
        { id: '1', title: 'Modern Waterfront Studio', description: null, category: 'WATERFRONT', status: 'ACTIVE', ownerId: 'mid-1', pricePerNight: 4500, createdAt: new Date(), city: 'Mumbai', address: 'Bandra West, Mumbai', latitude: 19.0596, longitude: 72.8295, imageUrls: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1502672260266-1c1e52db06ac?auto=format&fit=crop&w=1600&q=80'
        ]},
        { id: '2', title: 'Downtown Glass Loft', description: null, category: 'URBAN', status: 'PENDING_APPROVAL', ownerId: 'mid-1', pricePerNight: 3200, createdAt: new Date(), city: 'Delhi', address: 'Connaught Place, New Delhi', latitude: 28.6315, longitude: 77.2167, imageUrls: [
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80'
        ]},
    ];

    public findUserById(id: string) {
        return this.mockUsers.find(u => u.id === id);
    }

    public findUserByEmail(email: string) {
        return this.mockUsers.find(u => u.email === email.toLowerCase().trim());
    }

    public addUser(user: MockUser) {
        if (!this.findUserByEmail(user.email)) {
            this.mockUsers.push(user);
        }
    }
}

export const sharedMockStore = new SharedMockStore();
