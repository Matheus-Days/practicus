import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/prismicio";
import { firestore } from "@/lib/firebase-admin";
import { obfuscateCPF } from "@/app/utils/cpf-utils";
import { formatDate } from "@/app/utils";
import { asText } from "@prismicio/client";
import HeadingBadge from "@/app/components/HeadingBadge";
import PageBanner from "@/app/components/PageBanner";
import BoundedMain from "@/app/components/BoundedMain";
import { FieldContainer } from "@/app/components/FieldContainer";
import PageField from "@/app/components/PageField";
import { MdCheckCircle, MdError, MdPerson, MdBadge } from "react-icons/md";
import { CheckoutDocument } from "../../api/checkouts/checkout.types";
import { isPaymentByCommitment } from "../../api/checkouts/utils";

type Params = { eventId: string };
type SearchParams = { code?: string };

interface ValidationResult {
  valid: boolean;
  fullName?: string;
  cpf?: string;
  status?: string;
}

async function validateRegistration(
  eventId: string,
  code: string
): Promise<ValidationResult> {
  try {
    // Buscar inscrição pelo code (registrationId)
    const registrationDoc = await firestore
      .collection("registrations")
      .doc(code)
      .get();

    if (!registrationDoc.exists) {
      return { valid: false };
    }

    const registration = registrationDoc.data();

    if (!registration) {
      return { valid: false };
    }

    // Verificar se pertence ao evento correto
    if (registration.eventId !== eventId) {
      return { valid: false };
    }

    // Busca se a inscrição é de um checkout com pagamento por empenho
    const responsibleCheckout = await firestore
      .collection("checkouts")
      .doc(registration.checkoutId)
      .get();
    const responsibleCheckoutData = responsibleCheckout.data() as CheckoutDocument;
    const isFromCommitment = isPaymentByCommitment(responsibleCheckoutData);

    // Validar status
    const isValid =
      registration.status === "ok" || (isFromCommitment && registration.status === "pending");

    if (!isValid) {
      return { valid: false };
    }

    // Obfuscar CPF antes de retornar
    return {
      valid: true,
      fullName: registration.fullName,
      cpf: obfuscateCPF(registration.cpf),
      status: registration.status,
    };
  } catch (error) {
    console.error("Erro ao validar inscrição:", error);
    return { valid: false };
  }
}

export default async function ValidationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { eventId } = params;
  const { code } = searchParams;

  // Verificar se code foi fornecido
  if (!code) {
    return (
      <BoundedMain>
        <HeadingBadge as="h1" className="mb-3">
          Validação de Inscrição
        </HeadingBadge>

        <FieldContainer>
          <div className="flex items-center py-4 gap-3 border-b border-primary">
            <MdError className="h-8 w-8 text-red-500" />
            <div className="flex flex-col">
              <span className="font-display font-medium text-lg text-primary">
                Erro de Validação
              </span>
              <span className="text-red-600 text-base">
                Código de validação não fornecido.
              </span>
            </div>
          </div>
        </FieldContainer>
      </BoundedMain>
    );
  }

  try {
    // Buscar dados do evento e validar inscrição em paralelo
    const client = createClient();
    const [evento, validationResult] = await Promise.all([
      client.getByUID("evento", eventId),
      validateRegistration(eventId, code),
    ]);

    return (
      <BoundedMain>
        <HeadingBadge as="h1" className="mb-3">
          Validação de Inscrição
        </HeadingBadge>

        <PageBanner
          smImageField={evento.data.imagem_ilustrativa["Tela estreita"]}
          lgImageField={evento.data.imagem_ilustrativa.Banner}
          titleField={evento.data.nome_do_evento}
        />

        <div className="flex flex-col gap-4 my-8">
          <FieldContainer>
            <PageField iconName="event">
              Data:
              <span className="font-normal">
                {evento.data.data_do_evento
                  ? formatDate(evento.data.data_do_evento)
                  : "Data não informada"}
              </span>
            </PageField>
          </FieldContainer>

          <FieldContainer>
            <PageField iconName="location_on">
              Local: {evento.data.local_do_evento_curto}
            </PageField>
            <div className="mt-2">
              <span className="text-base text-gray-700">
                {asText(evento.data.local_do_evento_longo) ||
                  "Local não informado"}
              </span>
            </div>
          </FieldContainer>
        </div>

        <div className="flex flex-col gap-4">
          {validationResult.valid ? (
            <FieldContainer>
              <div className="flex items-center py-4 gap-3 border-b border-primary">
                <MdCheckCircle className="h-8 w-8 text-green-500" />
                <div className="flex flex-col">
                  <span className="font-display font-medium text-lg text-primary">
                    Inscrição Válida
                  </span>
                  <span className="text-primary text-base">
                    Confira abaixo se os dados do inscrito estão corretos.
                  </span>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 py-2">
                  <MdPerson className="h-6 w-6 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-display font-medium text-base text-primary">
                      Nome Completo:
                    </span>
                    <span className="text-lg text-gray-700">
                      {validationResult.fullName}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <MdBadge className="h-6 w-6 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-display font-medium text-base text-primary">
                      CPF:
                    </span>
                    <span className="text-lg text-gray-700">
                      {validationResult.cpf}
                    </span>
                  </div>
                </div>
              </div>
            </FieldContainer>
          ) : (
            <FieldContainer>
              <div className="flex items-center py-4 gap-3 border-b border-primary">
                <MdError className="h-8 w-8 text-red-500" />
                <div className="flex flex-col">
                  <span className="font-display font-medium text-lg text-primary">
                    Inscrição Inválida
                  </span>
                  <span className="text-red-600 text-base">
                    Inscrição não encontrada ou inválida
                  </span>
                </div>
              </div>
            </FieldContainer>
          )}
        </div>
      </BoundedMain>
    );
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  try {
    const client = createClient();
    const evento = await client.getByUID("evento", params.eventId);

    return {
      title: `Validação - ${asText(evento.data.nome_do_evento)}`,
      description: "Validação de inscrição no evento",
    };
  } catch {
    return {
      title: "Validação de Inscrição",
      description: "Validação de inscrição no evento",
    };
  }
}
