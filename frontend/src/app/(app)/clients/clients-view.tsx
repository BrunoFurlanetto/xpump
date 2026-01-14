"use client";

import { useState } from "react";
import React from "react";
import { useAllClients } from "@/hooks/useAdminQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Users, Filter, MoreHorizontal, Eye, Edit, Trash2, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import { CreateClientModal } from "@/components/admin/CreateClientModal";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { DeleteClientModal } from "@/components/admin/DeleteClientModal";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ClientsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const filters = {
    is_active: activeFilter === "all" ? undefined : activeFilter === "active",
    search: searchQuery || undefined,
  };

  const { data: rawData, isLoading, error } = useAllClients(1, 1000, "-created_at", {});

  // Aplicar filtros client-side
  const filteredData = React.useMemo(() => {
    if (!rawData?.results) return { results: [], count: 0 };

    let filtered = [...rawData.results];

    // Filtro de status
    if (activeFilter === "active") {
      filtered = filtered.filter((c) => c.is_active);
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter((c) => !c.is_active);
    }

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.cnpj.toLowerCase().includes(query) ||
          c.contact_email.toLowerCase().includes(query) ||
          c.client_code.toLowerCase().includes(query)
      );
    }

    return {
      results: filtered,
      count: filtered.length,
    };
  }, [rawData, activeFilter, searchQuery]);

  // Paginação client-side
  const data = React.useMemo(() => {
    if (!filteredData.results) return { results: [], count: 0 };

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      results: filteredData.results.slice(startIndex, endIndex),
      count: filteredData.count,
    };
  }, [filteredData, page, pageSize]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleFilterChange = (value: "all" | "active" | "inactive") => {
    setActiveFilter(value);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Gerenciar Clientes
          </h1>
          <p className="text-muted-foreground mt-1">Visualize e gerencie todas as empresas clientes da plataforma</p>
        </div>
        <CreateClientModal />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : data?.count || 0}
                </div>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    data?.results?.filter((c) => c.is_active).length || 0
                  )}
                </div>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Inativos</p>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    data?.results?.filter((c) => !c.is_active).length || 0
                  )}
                </div>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter by Status */}
            <Select value={activeFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">Erro ao carregar clientes. Tente novamente.</div>
          ) : !data?.results || data.results.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground mb-2">Nenhum cliente encontrado</p>
              <p className="text-muted-foreground">
                {searchQuery ? "Tente ajustar os filtros de busca" : "Comece criando um novo cliente"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.results.map((client) => (
                      <TableRow
                        key={client.id}
                        className="hover:bg-secondary/50 cursor-pointer"
                        onClick={() => {
                          setSelectedClient(client);
                          setEditModalOpen(true);
                        }}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{client.name}</span>
                            <span className="text-xs text-muted-foreground">ID: {client.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{client.cnpj}</TableCell>
                        <TableCell className="text-muted-foreground">{client.contact_email}</TableCell>
                        <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                        <TableCell>
                          <Badge
                            variant={client.is_active ? "default" : "secondary"}
                            className={
                              client.is_active
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            }
                          >
                            {client.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-secondary px-2 py-1 rounded">{client.client_code}</code>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(client.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div
                            className="text-destructive"
                            onClick={() => {
                              setSelectedClient(client);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, data.count)} de {data.count}{" "}
                  clientes
                </p>

                <div className="flex items-center gap-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (page <= 3) {
                          pageNumber = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = page - 2 + i;
                        }
                        return (
                          <Button
                            key={i}
                            variant={page === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                      Próximo
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {selectedClient && (
        <EditClientModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          clientId={selectedClient.id}
          initialData={{
            name: selectedClient.name,
            cnpj: selectedClient.cnpj,
            contact_email: selectedClient.contact_email,
            phone: selectedClient.phone,
            address: selectedClient.address,
            is_active: selectedClient.is_active,
          }}
        />
      )}

      {/* Delete Modal */}
      {selectedClient && (
        <DeleteClientModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      )}
    </div>
  );
}
