import { useState, useCallback, useRef } from "react";
import { createClient } from "../../prismicio";
import { EventoDocument } from "../../../prismicio-types";
import { RegistrationData } from "./registrationAPI";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { asText } from "@prismicio/client";
import { convertSvgToPng } from "./utils";
import { formatCPF } from "../utils/export-utils";

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

export const useRegistrationPDF = () => {
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
      const eventData: EventData = {
        uid: evento.uid,
        nome: asText(evento.data.nome_do_evento) || "Evento",
        local:
          asText(evento.data.local_do_evento_longo) || "Local não informado",
        data: evento.data.data_do_evento
          ? new Date(evento.data.data_do_evento).toLocaleDateString("pt-BR")
          : "Data não informada",
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

  const generateRegistrationPDF = useCallback(
    async (
      registration: RegistrationData,
      eventId: string
    ): Promise<{ blob: Blob; eventName: string } | void> => {
      if (
        !isSetupCompleteRef.current ||
        !logoDataRef.current ||
        !eventDataRef.current ||
        !pdfmakeRef.current
      ) {
        await setup(eventId);
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

      const validationCode = registration.id;
      const baseUrl = `${window.location.origin}/validacao/${eventId}`;
      const validationLink = `${baseUrl}?code=${validationCode}`;

      try {
        const logo = logoDataRef.current;
        const event = eventDataRef.current;
        const pdfmake = pdfmakeRef.current;

        const docDefinition: TDocumentDefinitions = {
          pageSize: "A4",
          pageOrientation: "portrait",
          pageMargins: [40, 40, 40, 60],
          images: {
            logo: logo.url,
          },
          content: [
            {
              image: "logo",
              width: 240,
              alignment: "center",
              margin: [0, 0, 0, 30],
            },
            {
              text: "COMPROVANTE DE INSCRIÇÃO",
              fontSize: 18,
              bold: true,
              alignment: "center",
              margin: [0, 0, 0, 30],
              color: "#1a1a1a",
            },
            {
              fontSize: 12,
              lineHeight: 1.5,
              alignment: "justify",
              margin: [0, 0, 0, 15],
              color: "#374151",
              text: [
                { text: "Para os devidos fins, declara-se que " },
                { text: registration.fullName, bold: true },
                { text: ", de CPF " },
                { text: formatCPF(registration.cpf), bold: true },
                { text: ", possui inscrição válida no evento " },
                { text: event.nome.toUpperCase(), bold: true },
                { text: " que será realizado pela " },
                { text: "Practicus Treinamento e Capacitação ", bold: true },
                {
                  text: "(CNPJ 50.416.175/0001-52) na data e local especificados abaixo.",
                },
              ],
            },
            {
              text: "DADOS DO EVENTO",
              fontSize: 14,
              bold: true,
              margin: [0, 0, 0, 10],
              color: "#528189",
            },
            {
              text: [{ text: "Data: ", bold: true }, { text: event.data }],
              fontSize: 14,
              margin: [0, 0, 0, 10],
              color: "#374151",
            },
            {
              text: [{ text: "Local: ", bold: true }, { text: event.local }],
              fontSize: 14,
              color: "#374151",
            },
          ],
          footer: [
            {
              text: [
                {
                  text: "Este documento foi gerado automaticamente pelo sistema da Practicus. Para verificar sua validade, acesse a página de validação deste comprovante através do link abaixo:",
                },
              ],
              style: "footerParagraph",
            },
            {
              text: baseUrl,
              link: validationLink,
              style: "footerParagraph",
              decoration: "underline",
              bold: true,
              color: "#528189",
            },
          ],
          styles: {
            footerParagraph: {
              margin: [20, 0, 20, 0],
              fontSize: 10,
              lineHeight: 1,
              color: "#374151",
              alignment: "justify",
            },
          },
        };

        const pdfDoc = pdfmake.createPdf(docDefinition);

        return new Promise<{ blob: Blob; eventName: string }>((resolve) => {
          pdfDoc.getBlob((blob: Blob) => {
            resolve({ blob, eventName: event.nome });
          });
        });
      } catch (err) {
        console.error("Erro ao gerar PDF:", err);
        setError("Erro ao gerar o PDF do comprovante");
      }
    },
    [setup]
  );

  return {
    setup,
    generateRegistrationPDF,
    isLoading,
    error,
    isReady:
      isSetupCompleteRef.current &&
      !!logoDataRef.current &&
      !!eventDataRef.current &&
      !!pdfmakeRef.current,
  };
};
