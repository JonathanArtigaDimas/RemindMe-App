import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, TYPOGRAPHY, useThemeColors, RADIUS, COLORS } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useNoteStore } from '../../src/store/noteStore';
import { Note } from '../../src/types';
import * as Haptics from 'expo-haptics';

export default function NotesScreen() {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const { notes, tags, addNote, updateNote, deleteNote, togglePin, addCustomTag } = useNoteStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const fontStyle = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily) };
  const fontBold = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily, 'bold') };
  const fontItalic = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily, 'italic') };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;

    if (editingNote) {
      updateNote(editingNote.id, { title, content, tags: selectedTags });
    } else {
      addNote({ title, content, isPinned: false, tags: selectedTags });
    }
    
    closeModal();
    if (settings.hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setNewTagInput('');
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedTags(note.tags || []);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar nota', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteNote(id) }
    ]);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedFilterTag ? (n.tags || []).includes(selectedFilterTag) : true;
    return matchesSearch && matchesTag;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity 
      style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => openEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.noteHeader}>
        <Text numberOfLines={1} style={[styles.noteTitle, { color: colors.text }, fontBold]}>
          {item.title || 'Sin título'}
        </Text>
        <TouchableOpacity onPress={() => togglePin(item.id)}>
          <Ionicons 
            name={item.isPinned ? 'pin' : 'pin-outline'} 
            size={18} 
            color={item.isPinned ? colors.primary : colors.textTertiary} 
          />
        </TouchableOpacity>
      </View>
      <Text numberOfLines={3} style={[styles.noteSnippet, { color: colors.textSecondary }, fontItalic]}>
        {item.content || 'Sin contenido'}
      </Text>
      {(item.tags && item.tags.length > 0) && (
        <View style={styles.noteTagsRow}>
          {item.tags.map(tag => (
            <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.tagText, { color: colors.primary }, fontStyle]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.noteFooter}>
        <Text style={[styles.noteDate, { color: colors.textTertiary }, fontStyle]}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }, fontBold]}>Mis Notas</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }, fontStyle]}
          placeholder="Buscar notas..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, !selectedFilterTag ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setSelectedFilterTag(null)}
          >
            <Text style={[styles.filterText, !selectedFilterTag ? { color: '#FFF' } : { color: colors.textSecondary }, fontStyle]}>Todo</Text>
          </TouchableOpacity>
          {tags.map(tag => (
            <TouchableOpacity 
              key={tag}
              style={[styles.filterChip, selectedFilterTag === tag ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setSelectedFilterTag(tag === selectedFilterTag ? null : tag)}
            >
              <Text style={[styles.filterText, selectedFilterTag === tag ? { color: '#FFF' } : { color: colors.textSecondary }, fontStyle]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }, fontStyle]}>
              No hay notas aún
            </Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={[styles.modalAction, { color: colors.textSecondary }, fontStyle]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }, fontBold]}>
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={[styles.modalAction, { color: colors.primary, fontWeight: '700' }, fontBold]}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }, fontBold]}
              placeholder="Título"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
            
            <View style={styles.tagsSelectionContainer}>
              <Text style={[styles.tagsLabel, { color: colors.textSecondary }, fontBold]}>Etiquetas (Opcional):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsSelectionScroll}>
                {tags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity 
                      key={tag}
                      style={[styles.tagSelectionChip, isSelected ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                    >
                      <Text style={[styles.filterText, isSelected ? { color: '#FFF' } : { color: colors.textSecondary }, fontStyle]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={[styles.tagSelectionChip, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 0 }]}>
                  <TextInput
                    style={[{ color: colors.text, fontSize: 14, minWidth: 80 }, fontStyle]}
                    placeholder="+ Nueva"
                    placeholderTextColor={colors.textTertiary}
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    onSubmitEditing={() => {
                      const t = newTagInput.trim();
                      if (t) {
                        addCustomTag(t);
                        if (!selectedTags.includes(t)) {
                          setSelectedTags([...selectedTags, t]);
                        }
                        setNewTagInput('');
                      }
                    }}
                  />
                </View>
              </ScrollView>
            </View>

            <TextInput
              style={[styles.contentInput, { color: colors.text }, fontStyle]}
              placeholder="Empieza a escribir..."
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.md,
    height: 46,
    borderRadius: RADIUS.lg,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  list: { paddingHorizontal: SPACING.base, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between' },
  noteCard: {
    width: '48%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  noteTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 4 },
  noteSnippet: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteDate: { fontSize: 11 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalAction: { fontSize: 16 },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  tagsSelectionContainer: { marginBottom: SPACING.md },
  tagsLabel: { fontSize: 14, marginBottom: SPACING.sm },
  tagsSelectionScroll: { gap: SPACING.sm },
  tagSelectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  contentInput: { flex: 1, fontSize: 17, lineHeight: 24 },
  filterContainer: { marginBottom: SPACING.sm },
  filterScroll: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  filterText: { fontSize: 14, fontWeight: '500' },
  noteTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
