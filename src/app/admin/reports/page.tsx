import AppLayout from "@/components/layout/AppLayout";
import { getSalesReportData } from "@/app/actions/reports";
import SalesReportClient from "@/components/reports/SalesReportClient";

export default async function AdminReportsPage() {
  const initialData = await getSalesReportData({ period: "30_DAYS" });

  return (
    <AppLayout requiredRole="ADMIN">
      <SalesReportClient initialData={initialData} />
    </AppLayout>
  );
}
