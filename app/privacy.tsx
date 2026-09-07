import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '../src/lib/theme';

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: 'Nenhum dado sai do aparelho',
    body: 'O Carrinho funciona 100% offline. Ele nunca se conecta à internet: nenhuma foto, texto ou informação da sua compra é enviada para qualquer servidor.',
  },
  {
    title: 'Leitura de etiqueta no próprio celular',
    body: 'O reconhecimento de texto das etiquetas de preço acontece inteiramente no seu aparelho. Nenhuma foto é enviada para serviços de nuvem ou de inteligência artificial.',
  },
  {
    title: 'Fotos ficam guardadas só no app',
    body: 'As fotos das etiquetas são salvas numa pasta privada do Carrinho, nunca na galeria do celular. Elas são apagadas automaticamente quando o item ou a lista correspondente é excluído.',
  },
  {
    title: 'Só a permissão de câmera',
    body: 'O app pede só a permissão de câmera, e apenas no momento em que você vai fotografar uma etiqueta. Ele nunca pede acesso a localização, contatos ou arquivos do celular.',
  },
  {
    title: 'Sem contas, sem rastreamento',
    body: 'Não existe cadastro, login ou coleta de dados de uso. O Carrinho não usa analytics nem serviços de terceiros para monitorar como você usa o app.',
  },
];

export default function PrivacyScreen() {
  const colors = useAppColors();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: colors.text }]}>Privacidade</Text>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
          <Text style={{ color: colors.textSecondary }}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
});
