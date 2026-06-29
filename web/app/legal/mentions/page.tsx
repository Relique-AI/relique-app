import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Pépite",
};

export default function MentionsPage() {
  return (
    <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
      <div>
        <h1 className="font-serif text-4xl text-text-primary mb-2">Mentions légales</h1>
        <p className="text-text-muted text-xs">Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004</p>
      </div>

      <Section title="Éditeur du site">
        <Row label="Société" value="AGENCE LEVEL UP" />
        <Row label="Forme juridique" value="Société par Actions Simplifiée (SAS)" />
        <Row label="Capital social" value="22 350,00 €" />
        <Row label="SIREN" value="820 038 685" />
        <Row label="SIRET (siège)" value="820 038 685 00013" />
        <Row label="RCS" value="820 038 685 R.C.S. Paris" />
        <Row label="Siège social" value="47 rue Lauriston, 75016 Paris" />
        <Row label="Email" value="contact@pepite.app" />
        <Row label="Directeur de la publication" value="Guillaume Gondoin, Président" />
      </Section>

      <Section title="Hébergement">
        <p>
          Le site est hébergé par <strong className="text-text-primary">Hostinger</strong>, dont le siège social est situé
          à Kaunas, Lituanie. Base de données hébergée par <strong className="text-text-primary">Supabase</strong>
          (infrastructure AWS, région EU-West).
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L'ensemble des éléments constituant le site Pépite (textes, graphismes, logiciels, photographies, images, sons,
          plans, noms, logos, créations et œuvres protégeables diverses) sont la propriété exclusive de AGENCE LEVEL UP SAS
          ou de ses partenaires, et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie de ces éléments,
          quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de AGENCE LEVEL UP SAS.
        </p>
      </Section>

      <Section title="Limitation de responsabilité">
        <p>
          AGENCE LEVEL UP SAS ne saurait être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur
          lors de l'accès au site, résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications indiquées,
          soit de l'apparition d'un bug ou d'une incompatibilité.
        </p>
        <p>
          AGENCE LEVEL UP SAS ne pourra également être tenue responsable des dommages indirects consécutifs à l'utilisation du site.
        </p>
      </Section>

      <Section title="Liens hypertextes">
        <p>
          Le site peut contenir des liens vers des sites tiers. AGENCE LEVEL UP SAS n'exerce aucun contrôle sur ces sites et
          décline toute responsabilité quant à leur contenu ou leurs pratiques en matière de données personnelles.
        </p>
      </Section>

      <Section title="Droit applicable">
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les juridictions françaises
          seront seules compétentes.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question, vous pouvez nous contacter à l'adresse :{" "}
          <strong className="text-text-primary">contact@pepite.app</strong>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-text-primary mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-text-muted w-40 flex-shrink-0">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
