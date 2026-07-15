import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Toggle } from '../components/ui/Toggle';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { ToastContainer, toast } from '../components/ui/Toast';
import { Tabs } from '../components/ui/Tabs';
import { CardSkeleton, TableRowSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { KPIStatCard } from '../components/ui/KPIStatCard';
import { Database } from 'lucide-react';

export const DevComponents: React.FC = () => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('tab-1');
  const tabsList = [
    { id: 'tab-1', label: 'Overview' },
    { id: 'tab-2', label: 'Profit Analytics' },
    { id: 'tab-3', label: 'Return Risk Model' },
  ];

  // Form states
  const [inputText, setInputText] = useState('');
  const [selectVal, setSelectVal] = useState('option-1');
  const [checkboxVal, setCheckboxVal] = useState(false);
  const [toggleVal, setToggleVal] = useState(false);

  // Table sort state
  const [sortCol, setSortCol] = useState<'name' | 'sales' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  const handleSort = (col: 'name' | 'sales') => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortCol(null);
        setSortDir(null);
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  return (
    <div className="min-h-screen bg-bg p-lg md:p-2xl text-text-primary">
      <ToastContainer />
      
      <header className="mb-2xl border-b border-border pb-lg">
        <h1 className="text-3xl font-bold text-primary mb-xs">ProfitLens Component Library</h1>
        <p className="text-text-secondary text-sm">Living style guide for Module 1 Foundation primitives and tokens.</p>
      </header>

      <div className="grid grid-cols-1 gap-2xl">
        
        {/* Color Palette and Typography */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Theme & Tokens</h2>
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
              <div className="p-md bg-primary text-surface rounded-md font-semibold text-center">
                Valley Green (Primary)<br/>#3F6B4F
              </div>
              <div className="p-md bg-primary-hover text-surface rounded-md font-semibold text-center">
                Primary Hover<br/>#30523C
              </div>
              <div className="p-md bg-secondary text-surface rounded-md font-semibold text-center">
                Pantone Green<br/>#00594C
              </div>
              <div className="p-md bg-border text-text-primary border border-border rounded-md font-semibold text-center">
                Border Color<br/>#E4E4E1
              </div>
              <div className="p-md bg-bg text-text-primary border border-border rounded-md font-semibold text-center">
                Page Bg<br/>#FAFAF8
              </div>
            </div>
          </Card>
        </section>

        {/* Buttons */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Buttons</h2>
          <Card>
            <div className="flex flex-wrap gap-md items-center">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
            <div className="flex flex-wrap gap-md items-center mt-lg">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" isLoading>Loading State</Button>
              <Button variant="primary" disabled>Disabled State</Button>
            </div>
          </Card>
        </section>

        {/* Badges */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Badges / Status Pills</h2>
          <Card>
            <div className="flex flex-wrap gap-md">
              <Badge variant="neutral">Neutral Badge</Badge>
              <Badge variant="success">Success Status</Badge>
              <Badge variant="warning">Warning Status</Badge>
              <Badge variant="danger">Danger Status</Badge>
              <Badge variant="info">Info Status</Badge>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Forms & Controls</h2>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="space-y-md">
                <Input
                  label="Product SKU Input"
                  placeholder="e.g. AMZ-SHOE-01"
                  helperText="Enter the official SKU name"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <Input
                  label="Product SKU (Error State)"
                  placeholder="e.g. AMZ-SHOE-01"
                  error="SKU name must be unique and non-empty"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              <div className="space-y-md">
                <Select
                  label="Select Category"
                  options={[
                    { value: 'option-1', label: 'Electronics' },
                    { value: 'option-2', label: 'Clothing' },
                    { value: 'option-3', label: 'Home Decor' },
                  ]}
                  value={selectVal}
                  onChange={(e) => setSelectVal(e.target.value)}
                />
                <div className="flex flex-col gap-md pt-xs">
                  <Checkbox
                    label="B2B Transaction (Enables tax deduction)"
                    checked={checkboxVal}
                    onChange={(e) => setCheckboxVal(e.target.checked)}
                  />
                  <Toggle
                    label="Autopilot Recommendations"
                    checked={toggleVal}
                    onChange={(e) => setToggleVal(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* KPI Stat Cards */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">KPI Stat Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <KPIStatCard
              label="Total Revenue"
              value="₹4,82,910"
              deltaPercent={12.4}
              deltaDirection="up"
            />
            <KPIStatCard
              label="Estimated Return Loss"
              value="₹82,400"
              deltaPercent={4.8}
              deltaDirection="down"
            />
            <KPIStatCard
              label="B2B Order Ratio"
              value="8.2%"
              deltaPercent={0}
              deltaDirection="neutral"
            />
          </div>
        </section>

        {/* Tabs */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Tabs</h2>
          <Card>
            <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />
            <div className="py-md text-sm text-text-secondary">
              Active tab content: <strong>{tabsList.find(t => t.id === activeTab)?.label}</strong>
            </div>
          </Card>
        </section>

        {/* Table */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Table</h2>
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead sortDirection={sortCol === 'name' ? sortDir : null} onSort={() => handleSort('name')}>
                  Product Category
                </TableHead>
                <TableHead sortDirection={sortCol === 'sales' ? sortDir : null} onSort={() => handleSort('sales')}>
                  Units Sold
                </TableHead>
                <TableHead>Profit Margin</TableHead>
                <TableHead>Risk Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Electronics</TableCell>
                <TableCell>1,250</TableCell>
                <TableCell>14.5%</TableCell>
                <TableCell><Badge variant="success">Low Risk</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Clothing & Apparel</TableCell>
                <TableCell>2,840</TableCell>
                <TableCell>31.2%</TableCell>
                <TableCell><Badge variant="warning">Moderate Risk</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Fragile Accessories</TableCell>
                <TableCell>420</TableCell>
                <TableCell>8.9%</TableCell>
                <TableCell><Badge variant="danger">High Return Risk</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        {/* Modal & Toasts */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Interactive Triggers (Modals & Notifications)</h2>
          <Card>
            <div className="flex flex-wrap gap-md">
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>Open Modal Dialog</Button>
              <Button variant="secondary" onClick={() => toast.success('Operation completed successfully!')}>Trigger Success Toast</Button>
              <Button variant="secondary" onClick={() => toast.info('System updates will roll out shortly.')}>Trigger Info Toast</Button>
              <Button variant="destructive" onClick={() => toast.error('Failed to parse upload schema.')}>Trigger Error Toast</Button>
            </div>
            
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="De-risk Suggestion details"
              footerSlot={
                <>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" onClick={() => {
                    setIsModalOpen(false);
                    toast.success('Strategy applied successfully.');
                  }}>Apply Recommendation</Button>
                </>
              }
            >
              <p className="mb-md">This strategy recommends halting shipping to selected states for category <strong>"Electronics"</strong> due to an average return rate higher than 32%.</p>
              <p>Estimated saving if applied: <span className="text-success font-bold">₹18,400 per month</span>.</p>
            </Modal>
          </Card>
        </section>

        {/* States: Empty, Error, Skeleton Loaders */}
        <section className="space-y-md">
          <h2 className="text-xl font-bold text-text-primary border-l-4 border-primary pl-xs">Empty, Error, and Loading Skeletons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <EmptyState
              icon={Database}
              title="No Sales Data Uploaded Yet"
              description="Upload your Amazon Sales Report (.csv) to start analyzing return risk parameters and net profit configurations."
              actionLabel="Scaffold Dummy Upload"
              onAction={() => toast.info('Mock uploader triggered.')}
            />
            <ErrorState
              title="Database Sync Failed"
              message="We were unable to secure a connection with the local database instance. Check your connection or system logs."
              onRetry={() => toast.info('Reconnecting...')}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <CardSkeleton />
            <div className="bg-surface border border-border rounded-lg p-lg shadow-sm space-y-md">
              <TableRowSkeleton cols={3} />
              <TableRowSkeleton cols={3} />
              <TableRowSkeleton cols={3} />
            </div>
            <ChartSkeleton />
          </div>
        </section>
        
      </div>
    </div>
  );
};
export default DevComponents;
