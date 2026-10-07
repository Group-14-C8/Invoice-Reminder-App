import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import type { Client } from "../../api/types";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { notify } from "../../components/ui/notify";
import { clientSchema, type ClientFormValues } from "./schemas";

const listKey = ["clients"];

export function ClientsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: listKey,
    queryFn: async () => apiRequest<Client[]>(endpoints.clients.list),
  });

  const createMutation = useMutation({
    mutationFn: async (values: ClientFormValues) =>
      apiRequest<Client>(endpoints.clients.create, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      setOpen(false);
      notify.success("Client saved");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: ClientFormValues;
    }) =>
      apiRequest<Client>(endpoints.clients.update(id), {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      setOpen(false);
      setEditing(null);
      notify.success("Client updated");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest<void>(endpoints.clients.remove(id), { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      notify.success("Client deleted");
    },
  });

  const filteredClients = useMemo(
    () =>
      data.filter((client) =>
        `${client.name} ${client.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [data, search],
  );

  if (isError) {
    return (
      <section className="page-section">
        <header className="page-header">
          <h1>Clients</h1>
        </header>
        <div className="form-error-inline" role="alert">
          <p>We couldn’t load your clients.</p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <header className="page-header">
        <h1>Clients</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Add client
        </Button>
      </header>

      <div className="toolbar">
        <div className="toolbar__search">
          <Input
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search clients"
            aria-label="Search clients"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton-stack" aria-label="Loading clients">
          <Skeleton width="100%" height={52} />
          <Skeleton width="100%" height={52} />
          <Skeleton width="100%" height={52} />
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          title="No clients yet."
          description="Add one to start billing."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add client
            </Button>
          }
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Open invoices</th>
              <th className="data-table__actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td className="data-table__total">0</td>
                <td className="data-table__actions">
                  <div className="toolbar__sort">
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        setEditing(client);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void removeMutation.mutateAsync(client.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ClientDrawer
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit client" : "Add client"}
        initialValues={editing ?? { name: "", email: "" }}
        onSubmit={(values) => {
          if (editing) {
            void updateMutation.mutateAsync({ id: editing.id, values });
          } else {
            void createMutation.mutateAsync(values);
          }
        }}
      />
    </section>
  );
}

function ClientDrawer({
  open,
  onOpenChange,
  title,
  initialValues,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValues: ClientFormValues;
  onSubmit: (values: ClientFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialValues,
  });

  return (
    <Drawer
      title={title}
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset(initialValues);
      }}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>Save</Button>
        </>
      }
    >
      <form
        className="client-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field id="client-name" label="Name" error={errors.name?.message}>
          <Input {...register("name")} autoComplete="name" />
        </Field>
        <Field id="client-email" label="Email" error={errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="email" />
        </Field>
      </form>
    </Drawer>
  );
}
