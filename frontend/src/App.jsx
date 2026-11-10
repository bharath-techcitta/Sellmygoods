import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import AiAssistant from './components/AiAssistant';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SupplierDirectory from './pages/admin/SupplierDirectory';
import SupplierDetail from './pages/admin/SupplierDetail';
import CategoryItemMaster from './pages/admin/CategoryItemMaster';
import ApprovalWorkflowDesigner from './pages/admin/ApprovalWorkflowDesigner';
import RequisitionList from './pages/admin/RequisitionList';
import RequisitionDetail from './pages/admin/RequisitionDetail';
import BidList from './pages/admin/BidList';
import BidDetail from './pages/admin/BidDetail';
import PurchaseOrderList from './pages/admin/PurchaseOrderList';
import PurchaseOrderDetail from './pages/admin/PurchaseOrderDetail';
import RouteFallback from './components/RouteFallback';
import InvoiceManagement from './pages/admin/InvoiceManagement';
import AuctionDirectory from './pages/admin/AuctionDirectory';
import ContractClauses from './pages/admin/ContractClauses';
import BudgetSpendReports from './pages/admin/BudgetSpendReports';
import IntegrationsErp from './pages/admin/IntegrationsErp';
import AiAnalysisDashboard from './pages/admin/AiAnalysisDashboard';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import SupplierRegistrationWizard from './pages/buyer/SupplierRegistrationWizard';
import BuyerBidList from './pages/buyer/BuyerBidList';
import BuyerBidResponse from './pages/buyer/BuyerBidResponse';
import BuyerPurchaseOrders from './pages/buyer/BuyerPurchaseOrders';
import BuyerInvoices from './pages/buyer/BuyerInvoices';
import BuyerContracts from './pages/buyer/BuyerContracts';
import BuyerAuctions from './pages/buyer/BuyerAuctions';
import LiveAuctionBiddingEntry from './pages/buyer/LiveAuctionBiddingEntry';
import LiveAuctionAdminConsole from './pages/admin/LiveAuctionAdminConsole';

import { api } from './api';
import { readDemoSession, writeDemoSession } from './demoSession';

const ADMIN_ROUTES = new Set([
  'dashboard', 'suppliers', 'supplier-detail', 'categories', 'workflows',
  'requisitions', 'requisition-detail', 'bids', 'bid-detail',
  'purchase-orders', 'purchase-order-detail', 'invoices', 'contracts',
  'auctions', 'auction-monitor', 'budgets', 'integrations', 'ai-analysis',
]);

const BUYER_ROUTES = new Set([
  'buyer-dashboard', 'registration-wizard', 'buyer-bids', 'buyer-bid-response',
  'buyer-pos', 'buyer-invoices', 'buyer-contracts', 'buyer-auctions', 'buyer-auction-console', 'buyer-profile',
]);

export default function App() {
  const [activePortal, setActivePortal] = useState('admin'); // 'admin' or 'buyer'
  const [currentRole, setCurrentRole] = useState('procurement_buyer');
  const [currentSupplierId, setCurrentSupplierId] = useState(1);
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Selected object IDs for detail views
  const [selectedSupplierId, setSelectedSupplierId] = useState(1);
  const [selectedPrId, setSelectedPrId] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState(1);
  const [selectedPoId, setSelectedPoId] = useState(1);
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);

  useEffect(() => {
    const saved = readDemoSession();
    setActivePortal(saved.portal);
    setCurrentRole(saved.role);
    setCurrentSupplierId(saved.supplier_id ?? 1);
    setCurrentRoute(saved.portal === 'admin' ? 'dashboard' : 'buyer-dashboard');

    // Optional health check — do NOT overwrite role/portal from server (avoids reset on deploy).
    api.getMe().catch((err) => {
      console.warn('[Procurio] API unreachable; using saved demo role.', err?.message || err);
    });
  }, []);

  const handleSwitchRole = async (role, portal, supplierId = 1) => {
    const sid = supplierId || 1;
    writeDemoSession({ role, portal, supplier_id: sid });
    setActivePortal(portal);
    setCurrentRole(role);
    setCurrentSupplierId(sid);
    setCurrentRoute(portal === 'admin' ? 'dashboard' : 'buyer-dashboard');
    try {
      await api.switchRole(role, portal, sid);
    } catch (e) {
      console.error(e);
    }
  };

  const navigateTo = (route) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f7f7f8' }}>
      {/* Deep Purple Sidebar (Section C1, #2e1857, 242px) */}
      <Sidebar
        activePortal={activePortal}
        currentRoute={currentRoute}
        navigateTo={navigateTo}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Navbar (58px) */}
        <Navbar
          activePortal={activePortal}
          currentRole={currentRole}
          currentSupplierId={currentSupplierId}
          onSwitchRole={handleSwitchRole}
          onNavigate={navigateTo}
          onOpenAuction={(id) => {
            setSelectedAuctionId(id);
            navigateTo('buyer-auction-console');
          }}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Content Page (18-24px padding) */}
        <main key={`${currentRole}-${currentSupplierId}`} style={{ flex: 1, padding: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {/* Admin Routes */}
          {activePortal === 'admin' && (
            <>
              {currentRoute === 'dashboard' && <AdminDashboard navigateTo={navigateTo} />}
              {currentRoute === 'suppliers' && (
                <SupplierDirectory
                  navigateTo={navigateTo}
                  onSelectSupplier={(id) => setSelectedSupplierId(id)}
                />
              )}
              {currentRoute === 'supplier-detail' && (
                <SupplierDetail
                  supplierId={selectedSupplierId}
                  onBack={() => navigateTo('suppliers')}
                />
              )}
              {currentRoute === 'categories' && <CategoryItemMaster />}
              {currentRoute === 'workflows' && <ApprovalWorkflowDesigner />}
              {currentRoute === 'requisitions' && (
                <RequisitionList
                  navigateTo={navigateTo}
                  onSelectPR={(id) => setSelectedPrId(id)}
                />
              )}
              {currentRoute === 'requisition-detail' && (
                <RequisitionDetail
                  prId={selectedPrId}
                  onBack={() => navigateTo('requisitions')}
                  navigateTo={navigateTo}
                  onAuctionCreated={(id) => {
                    setSelectedAuctionId(id);
                    navigateTo('auction-monitor');
                  }}
                  onPoCreated={(id) => {
                    setSelectedPoId(id);
                    navigateTo('purchase-order-detail');
                  }}
                />
              )}
              {currentRoute === 'bids' && (
                <BidList
                  navigateTo={navigateTo}
                  onSelectEvent={(id) => setSelectedEventId(id)}
                />
              )}
              {currentRoute === 'bid-detail' && (
                <BidDetail
                  eventId={selectedEventId}
                  onBack={() => navigateTo('bids')}
                  navigateTo={navigateTo}
                />
              )}
              {currentRoute === 'purchase-orders' && (
                <PurchaseOrderList
                  navigateTo={navigateTo}
                  onSelectPO={(id) => setSelectedPoId(id)}
                />
              )}
              {currentRoute === 'purchase-order-detail' && (
                <PurchaseOrderDetail
                  poId={selectedPoId}
                  onBack={() => navigateTo('purchase-orders')}
                  navigateTo={navigateTo}
                />
              )}
              {currentRoute === 'invoices' && <InvoiceManagement />}
              {currentRoute === 'contracts' && <ContractClauses />}
              {currentRoute === 'auctions' && (
                <AuctionDirectory
                  navigateTo={navigateTo}
                  onSelectAuction={(id) => setSelectedAuctionId(id)}
                />
              )}
              {currentRoute === 'auction-monitor' && (
                selectedAuctionId != null ? (
                  <LiveAuctionAdminConsole
                    auctionId={selectedAuctionId}
                    onBack={() => navigateTo('auctions')}
                  />
                ) : (
                  <RouteFallback navigateTo={navigateTo} portal="admin" />
                )
              )}
              {currentRoute === 'budgets' && <BudgetSpendReports />}
              {currentRoute === 'integrations' && <IntegrationsErp />}
              {currentRoute === 'ai-analysis' && <AiAnalysisDashboard />}
              {!ADMIN_ROUTES.has(currentRoute) && (
                <RouteFallback navigateTo={navigateTo} portal="admin" />
              )}
            </>
          )}

          {/* Buyer Routes */}
          {activePortal === 'buyer' && (
            <>
              {currentRoute === 'buyer-dashboard' && <BuyerDashboard navigateTo={navigateTo} />}
              {currentRoute === 'registration-wizard' && (
                <SupplierRegistrationWizard
                  onComplete={() => {
                    navigateTo('buyer-dashboard');
                  }}
                />
              )}
              {currentRoute === 'buyer-bids' && (
                <BuyerBidList
                  navigateTo={navigateTo}
                  onSelectEvent={(id) => setSelectedEventId(id)}
                />
              )}
              {currentRoute === 'buyer-bid-response' && (
                <BuyerBidResponse
                  eventId={selectedEventId}
                  onBack={() => navigateTo('buyer-bids')}
                  navigateTo={navigateTo}
                />
              )}
              {currentRoute === 'buyer-pos' && <BuyerPurchaseOrders navigateTo={navigateTo} />}
              {currentRoute === 'buyer-invoices' && <BuyerInvoices />}
              {currentRoute === 'buyer-contracts' && <BuyerContracts />}
              {currentRoute === 'buyer-auctions' && (
                <BuyerAuctions
                  navigateTo={navigateTo}
                  onSelectAuction={(id) => setSelectedAuctionId(id)}
                />
              )}
              {currentRoute === 'buyer-auction-console' && (
                selectedAuctionId != null ? (
                  <LiveAuctionBiddingEntry
                    auctionId={selectedAuctionId}
                    onBack={() => navigateTo('buyer-auctions')}
                  />
                ) : (
                  <RouteFallback navigateTo={navigateTo} portal="buyer" />
                )
              )}
              {currentRoute === 'buyer-profile' && (
                <SupplierDetail supplierId={currentSupplierId} onBack={() => navigateTo('buyer-dashboard')} />
              )}
              {!BUYER_ROUTES.has(currentRoute) && (
                <RouteFallback navigateTo={navigateTo} portal="buyer" />
              )}
            </>
          )}
        </main>

        {/* Footer (42px) */}
        <Footer />
      </div>

      {/* Floating Purple AI Assistant (56px) */}
      <AiAssistant />
    </div>
  );
}

