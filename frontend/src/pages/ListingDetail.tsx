import { useParams } from 'react-router-dom';

export default function ListingDetail() {
    const { id } = useParams();

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Listing Detail</h1>
            <p className="text-slate-600">Managing state and availability for listing ID: {id}</p>
        </div>
    );
}
