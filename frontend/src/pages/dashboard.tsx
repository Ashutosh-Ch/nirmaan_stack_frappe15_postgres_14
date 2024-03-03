import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/breadcrumbs";
import { NavBar } from "@/components/nav/nav-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFrappeGetDocCount } from "frappe-react-sdk";
import { HardHat } from "lucide-react";
import { Suspense } from "react";
import { TailSpin } from "react-loader-spinner";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const { data: project_count, isLoading: project_count_loading, error: project_count_error } = useFrappeGetDocCount("Projects");


    return (
        <>
            <NavBar />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <Breadcrumb>
                        <BreadcrumbItem isCurrentPage>
                            <BreadcrumbLink href="/wp">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </Breadcrumb>
                </div>
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Modules List</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <Card className="hover:animate-shadow-drop-center" >
                        <Link to="/projects">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Projects
                                </CardTitle>
                                <HardHat className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(project_count_loading) ? (<TailSpin visible={true} height="30" width="30" color="#9C33FF" ariaLabel="tail-spin-loading" radius="1" wrapperStyle={{}} wrapperClass="" />)
                                        : (project_count)}
                                    {project_count_error && <p>Error</p>}
                                </div>
                                <p className="text-xs text-muted-foreground">COUNT</p>
                            </CardContent>
                        </Link>
                    </Card>
                </div>
            </div>
        </>
    )
}