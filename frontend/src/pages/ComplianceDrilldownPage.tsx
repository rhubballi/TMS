import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface MatrixRecord {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        department: string;
    };
    training: {
        title: string;
        code: string;
        version: string;
    };
    trainingMaster?: {
        title: string;
        training_code: string;
    };
    status: string;
    score?: number;
    passed?: boolean;
    assessmentAttempts: number;
    dueDate: string;
    completedDate?: string;
    completedLate?: boolean;
    expiryDate?: string;
    certificateId?: string;
}

const ComplianceDrilldownPage: React.FC = () => {
    const { type, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredData, setFilteredData] = useState<MatrixRecord[]>([]);

    useEffect(() => {
        fetchAndFilterData();
    }, [type, id]);

    const fetchAndFilterData = async () => {
        try {
            setLoading(true);
            // reused the matrix endpoint as it contains the raw data needed for drilldown
            const response = await api.get('/training-matrix');

            if (response.data && response.data.data) {
                let records: MatrixRecord[] = response.data.data;

                // Filter Logic
                if (type === 'department') {
                    // Start of the drilldown - filter by department name (id is dept name here)
                    const deptName = decodeURIComponent(id || '');
                    records = records.filter(r => r.user?.department === deptName);
                } else if (type === 'training') {
                    // Filter by training ID
                    // The 'id' param from heatmap is trainingId (training._id)
                    records = records.filter(r => {
                        // Check populated training object id
                        const tId = (r.training as any)?._id || (r.training as any);
                        return tId === id;
                    });
                }

                setFilteredData(records);
            }
            setLoading(false);
        } catch (err: any) {
            console.error('Drilldown Fetch Error:', err);
            setError('Failed to load drill-down data. Check permissions.');
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Badge bg="success">COMPLETED</Badge>;
            case 'FAILED': return <Badge bg="danger">FAILED</Badge>;
            case 'OVERDUE': return <Badge bg="danger">OVERDUE</Badge>;
            case 'IN_PROGRESS': return <Badge bg="primary">IN PROGRESS</Badge>;
            case 'EXPIRED': return <Badge bg="warning" text="dark">EXPIRED</Badge>;
            case 'LOCKED': return <Badge bg="secondary">LOCKED</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/admin/compliance-dashboard')} className="mb-2">
                        &larr; Back to Dashboard
                    </Button>
                    <h2>Compliance Drill-Down: {type === 'department' ? decodeURIComponent(id || '') : 'Training Analysis'}</h2>
                </div>
                <Badge bg="info">READ-ONLY DETAILED VIEW</Badge>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading Detailed Records...</p>
                </div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : (
                <Card className="shadow-sm">
                    <Card.Body className="p-0">
                        <Table striped hover responsive className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>User</th>
                                    <th>Department</th>
                                    <th>Training</th>
                                    <th>Status</th>
                                    <th>Score</th>
                                    <th>Attempts</th>
                                    <th>Risk Factors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((record) => (
                                        <tr key={record._id}>
                                            <td>
                                                <div className="fw-bold">{record.user?.name || 'N/A'}</div>
                                                <small className="text-muted">{record.user?.email}</small>
                                            </td>
                                            <td>{record.user?.department || 'N/A'}</td>
                                            <td>
                                                {record.training?.title || record.trainingMaster?.title || 'Unknown Training'}
                                                <div className="text-muted small">{record.training?.code}</div>
                                            </td>
                                            <td>{getStatusBadge(record.status)}</td>
                                            <td>
                                                {record.score !== undefined ? (
                                                    <span className={record.passed ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                                        {record.score}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td>{record.assessmentAttempts}</td>
                                            <td>
                                                {record.status === 'OVERDUE' && <Badge bg="danger" className="me-1">OVERDUE</Badge>}
                                                {record.status === 'FAILED' && <Badge bg="danger" className="me-1">FAILED</Badge>}
                                                {record.completedLate && <Badge bg="warning" text="dark" className="me-1">LATE</Badge>}
                                                {record.status === 'LOCKED' && <Badge bg="dark" className="me-1">LOCKED</Badge>}
                                                {record.status === 'EXPIRED' && <Badge bg="secondary" className="me-1">EXPIRED</Badge>}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4">No records found for this criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default ComplianceDrilldownPage;
