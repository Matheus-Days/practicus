import { useState, useCallback, useRef } from "react";
import { createClient } from "../../prismicio";
import { EventoDocument } from "../../../prismicio-types";
import { CheckoutData } from "../types/checkout";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { asText } from "@prismicio/client";
import { convertSvgToPng, localizeDate } from "./utils";

interface LogoData {
  url: string;
  alt?: string;
}

interface EventData {
  uid: string;
  nome: string;
  local: string;
  data: string;
}

export const useVoucherPDF = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoDataRef = useRef<LogoData | null>(null);
  const eventDataRef = useRef<EventData | null>(null);
  const pdfmakeRef = useRef<typeof import("pdfmake/build/pdfmake") | null>(
    null
  );
  const isSetupCompleteRef = useRef<boolean>(false);

  const setup = useCallback(async (eventUID: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const client = createClient();

      const configuracoes = await client.getSingle("configuracoes");
      const logoUrl = configuracoes.data.logo.url;
      const logoAlt = configuracoes.data.logo.alt || "Logo Practicus";

      const logoLocalPng = await convertSvgToPng(logoUrl || "");

      const evento = (await client.getByUID(
        "evento",
        eventUID
      )) as EventoDocument;
      const eventDate = localizeDate(evento.data.data_do_evento?.toString() || "");
      const eventData: EventData = {
        uid: evento.uid,
        nome: asText(evento.data.nome_do_evento) || "Evento",
        local:
          asText(evento.data.local_do_evento_longo) || "Local não informado",
        data: eventDate || "Data não informada",
      };

      const pdfmakeModule = await import("pdfmake/build/pdfmake");
      const pdfmake = pdfmakeModule.default;

      const vfs = await import("pdfmake/build/vfs_fonts");
      pdfmake.vfs = vfs.default as unknown as { [file: string]: string };

      const logoData: LogoData = {
        url: logoLocalPng,
        alt: logoAlt,
      };

      logoDataRef.current = logoData;
      eventDataRef.current = eventData;
      pdfmakeRef.current = pdfmake;
      isSetupCompleteRef.current = true;
    } catch (err) {
      console.error("Erro no setup do PDF:", err);
      setError("Erro ao carregar dados para o PDF");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateVoucherPDF = useCallback(
    async (
      checkoutData: CheckoutData
    ): Promise<{ blob: Blob; eventName: string } | void> => {
      if (
        !isSetupCompleteRef.current ||
        !logoDataRef.current ||
        !eventDataRef.current ||
        !pdfmakeRef.current
      ) {
        await setup(checkoutData.eventId);
      }

      if (
        !logoDataRef.current ||
        !eventDataRef.current ||
        !pdfmakeRef.current
      ) {
        setError(
          "Dados do PDF não foram carregados. Execute setup() primeiro."
        );
        return;
      }

      try {
        const isAdminCheckout = checkoutData.checkoutType === "admin";
        const logo = logoDataRef.current;
        const event = eventDataRef.current;
        const pdfmake = pdfmakeRef.current;

        const hostname =
          typeof window !== "undefined" ? window.location.origin : "";

        // Para checkouts de admin, não extrair informações de billing
        let responsavelNome = "Nome não informado";
        let responsavelTelefone = "Telefone não informado";
        let responsavelEmail = "Email não informado";

        if (!isAdminCheckout && checkoutData.billingDetails) {
          const responsavel = checkoutData.billingDetails;
          if ("fullName" in responsavel) {
            responsavelNome = responsavel.fullName;
            responsavelTelefone = responsavel.phone;
            responsavelEmail = responsavel.email;
          } else if ("orgName" in responsavel) {
            responsavelNome = responsavel.responsibleName;
            responsavelTelefone = responsavel.responsiblePhone;
            responsavelEmail = responsavel.responsibleEmail;
          }
        }

        const voucherCode = checkoutData.voucher || "Código não encontrado";

        // URL canônica do fluxo de inscrição com voucher (AttendeeFlow lê searchParams.get('voucher'))
        const inscricaoLink = `${hostname}/evento/${event.uid}/inscricao?voucher=${encodeURIComponent(voucherCode)}`;
        const contatoLink = `${hostname}/contato`;

        const docDefinition: TDocumentDefinitions = {
          pageSize: "A4",
          pageOrientation: "portrait",
          pageMargins: [40, 40, 40, 40],
          images: {
            logo: logo.url,
          },
          content: [
            {
              image: "logo",
              width: 240,
              alignment: "center",
              margin: [0, 0, 0, 20],
            },
            {
              text: event.nome,
              fontSize: 16,
              bold: true,
              alignment: "center",
              margin: [0, 0, 0, 15],
              color: "#1a1a1a",
            },
            {
              text: `Local: ${event.local}`,
              fontSize: 14,
              alignment: "center",
              margin: [0, 0, 0, 10],
              color: "#374151",
            },
            {
              text: `Data: ${event.data}`,
              fontSize: 14,
              alignment: "center",
              margin: [0, 0, 0, 20],
              color: "#374151",
            },
            {
              text: "Código do voucher:",
              fontSize: 14,
              alignment: "center",
              margin: [0, 0, 0, 5],
              color: "#000000",
            },
            {
              text: voucherCode,
              fontSize: 20,
              bold: true,
              alignment: "center",
              margin: [0, 0, 0, 20],
              color: "#ffffff",
              background: "#528189",
            },
            {
              text: "Você pode usar esse código para se inscrever no website da Practicus ou clicando no link abaixo:",
              fontSize: 12,
              alignment: "center",
              margin: [0, 0, 0, 10],
              color: "#374151",
            },
            {
              text: inscricaoLink,
              fontSize: 12,
              alignment: "center",
              margin: [0, 0, 0, 30],
              color: "#528189",
              link: inscricaoLink,
            },
            // Incluir informações do responsável apenas para checkouts normais (não admin)
            ...(isAdminCheckout
              ? []
              : [
                  {
                    text: "Em caso de dúvidas, o responsável pela compra deste voucher é:",
                    fontSize: 11,
                    margin: [0, 0, 0, 5] as [number, number, number, number],
                    color: "#374151",
                  },
                  {
                    text: `Nome: ${responsavelNome}`,
                    fontSize: 11,
                    margin: [0, 0, 0, 3] as [number, number, number, number],
                    color: "#374151",
                  },
                  {
                    text: `Telefone: ${responsavelTelefone}`,
                    fontSize: 11,
                    margin: [0, 0, 0, 3] as [number, number, number, number],
                    color: "#374151",
                  },
                  {
                    text: `Email: ${responsavelEmail}`,
                    fontSize: 11,
                    margin: [0, 0, 0, 20] as [number, number, number, number],
                    color: "#374151",
                  },
                ]),
            {
              text: "Em caso de dificuldades técnicas, entre em contato com a Practicus através dos meios oficiais:",
              fontSize: 10,
              margin: [0, 0, 0, 5] as [number, number, number, number],
              color: "#6b7280",
            },
            {
              text: contatoLink,
              fontSize: 10,
              color: "#528189",
              link: contatoLink,
            },
          ],
          styles: {
            header: {
              fontSize: 18,
              bold: true,
              margin: [0, 0, 0, 10],
            },
            subheader: {
              fontSize: 16,
              bold: true,
              margin: [0, 10, 0, 5],
            },
            quote: {
              italics: true,
            },
            small: {
              fontSize: 8,
            },
          },
        };

        const pdfDoc = pdfmake.createPdf(docDefinition);

        return new Promise<{ blob: Blob; eventName: string }>(
          (resolve, reject) => {
            pdfDoc.getBlob((blob: Blob) => {
              resolve({ blob, eventName: event.nome });
            });
          }
        );
      } catch (err) {
        console.error("Erro ao gerar PDF:", err);
        setError("Erro ao gerar o PDF do voucher");
      }
    },
    [setup]
  );

  return {
    setup,
    generateVoucherPDF,
    isLoading,
    error,
    isReady:
      isSetupCompleteRef.current &&
      !!logoDataRef.current &&
      !!eventDataRef.current &&
      !!pdfmakeRef.current,
  };
};
